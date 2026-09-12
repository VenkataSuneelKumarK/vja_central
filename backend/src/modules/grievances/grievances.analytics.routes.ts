import { Router, Request } from "express";
import { FilterQuery } from "mongoose";
import { Grievance, IGrievance } from "@/models/Grievance";
import { asyncHandler } from "@/common/asyncHandler";
import { ok } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { GRIEVANCE_VIEW_ROLES, GRIEVANCE_COMPLETED_STATUSES, GRIEVANCE_PENDING_STATUSES } from "@/common/constants";

const router = Router();
router.use(requireAuth, requireRole(GRIEVANCE_VIEW_ROLES));

// Shared with the list endpoint's filter shape (§30/§56: every dashboard
// number must reflect the currently selected filters, not a separate
// unfiltered global total shown alongside filtered charts).
function buildFilter(req: Request): FilterQuery<IGrievance> {
  const filter: FilterQuery<IGrievance> = {};
  const q = req.query;
  if (q.priority) filter.priority = q.priority;
  if (q.category) filter.category = q.category;
  if (q.subCategory) filter.subCategory = q.subCategory;
  if (q.ward) filter.ward = q.ward;
  if (q.area) filter.area = q.area;
  if (q.department) filter.department = q.department;
  if (q.assignedOfficer) filter.assignedOfficer = q.assignedOfficer;
  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) (filter.createdAt as Record<string, Date>).$gte = new Date(String(q.from));
    if (q.to) (filter.createdAt as Record<string, Date>).$lte = new Date(String(q.to));
  }
  return filter;
}

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const filter = buildFilter(req);
    const now = new Date();

    const [total, resolved, pending, overdue] = await Promise.all([
      Grievance.countDocuments(filter),
      Grievance.countDocuments({ ...filter, status: { $in: GRIEVANCE_COMPLETED_STATUSES } }),
      Grievance.countDocuments({ ...filter, status: { $in: GRIEVANCE_PENDING_STATUSES } }),
      Grievance.countDocuments({ ...filter, status: { $in: GRIEVANCE_PENDING_STATUSES }, dueDate: { $lt: now } }),
    ]);

    const [emergency, high, normal, suggestion] = await Promise.all([
      Grievance.countDocuments({ ...filter, priority: "emergency", status: { $in: GRIEVANCE_PENDING_STATUSES } }),
      Grievance.countDocuments({ ...filter, priority: "high", status: { $in: GRIEVANCE_PENDING_STATUSES } }),
      Grievance.countDocuments({ ...filter, priority: "normal", status: { $in: GRIEVANCE_PENDING_STATUSES } }),
      Grievance.countDocuments({ ...filter, priority: "suggestion", status: { $in: GRIEVANCE_PENDING_STATUSES } }),
    ]);

    // §57: Resolution Rate = Resolved / Total * 100 — documented formula,
    // computed here rather than duplicated per chart.
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0;

    const avgResolutionAgg = await Grievance.aggregate([
      { $match: { ...filter, resolvedAt: { $ne: null } } },
      { $project: { hours: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60] } } },
      { $group: { _id: null, avgHours: { $avg: "$hours" } } },
    ]);
    const avgResolutionHours = avgResolutionAgg[0]?.avgHours ?? null;

    ok(res, {
      total,
      resolved,
      pending,
      overdue,
      resolutionRate,
      avgResolutionDays: avgResolutionHours != null ? Math.round((avgResolutionHours / 24) * 10) / 10 : null,
      priorityBreakdown: { emergency, high, normal, suggestion },
    });
  })
);

router.get(
  "/analytics/category",
  asyncHandler(async (req, res) => {
    const filter = buildFilter(req);
    const rows = await Grievance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ["$status", GRIEVANCE_COMPLETED_STATUSES] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$status", GRIEVANCE_PENDING_STATUSES] }, 1, 0] } },
        },
      },
      { $lookup: { from: "grievancecategories", localField: "_id", foreignField: "_id", as: "categoryDoc" } },
      { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          category: "$categoryDoc.name",
          total: 1,
          resolved: 1,
          pending: 1,
          resolutionRate: { $cond: [{ $gt: ["$total", 0] }, { $round: [{ $multiply: [{ $divide: ["$resolved", "$total"] }, 100] }, 0] }, 0] },
        },
      },
      { $sort: { total: -1 } },
    ]);
    ok(res, rows);
  })
);

router.get(
  "/analytics/ward",
  asyncHandler(async (req, res) => {
    const filter = buildFilter(req);
    const rows = await Grievance.aggregate([
      { $match: { ...filter, ward: { $nin: [null, ""] } } },
      {
        $group: {
          _id: "$ward",
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ["$status", GRIEVANCE_COMPLETED_STATUSES] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$status", GRIEVANCE_PENDING_STATUSES] }, 1, 0] } },
          avgResolutionHours: {
            $avg: { $cond: [{ $ne: ["$resolvedAt", null] }, { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60] }, null] },
          },
        },
      },
      {
        $project: {
          ward: "$_id",
          total: 1,
          resolved: 1,
          pending: 1,
          resolutionRate: { $cond: [{ $gt: ["$total", 0] }, { $round: [{ $multiply: [{ $divide: ["$resolved", "$total"] }, 100] }, 0] }, 0] },
          avgResolutionDays: { $round: [{ $divide: [{ $ifNull: ["$avgResolutionHours", 0] }, 24] }, 1] },
        },
      },
      { $sort: { total: -1 } },
    ]);
    ok(res, rows);
  })
);

router.get(
  "/analytics/department",
  asyncHandler(async (req, res) => {
    const filter = buildFilter(req);
    const now = new Date();
    const rows = await Grievance.aggregate([
      { $match: { ...filter, department: { $ne: null } } },
      {
        $group: {
          _id: "$department",
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ["$status", GRIEVANCE_COMPLETED_STATUSES] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$status", GRIEVANCE_PENDING_STATUSES] }, 1, 0] } },
          slaBreaches: {
            $sum: { $cond: [{ $and: [{ $in: ["$status", GRIEVANCE_PENDING_STATUSES] }, { $lt: ["$dueDate", now] }] }, 1, 0] },
          },
          avgResolutionHours: {
            $avg: { $cond: [{ $ne: ["$resolvedAt", null] }, { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60] }, null] },
          },
        },
      },
      { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "departmentDoc" } },
      { $unwind: { path: "$departmentDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          department: "$departmentDoc.name",
          total: 1,
          resolved: 1,
          pending: 1,
          slaBreaches: 1,
          avgResolutionDays: { $round: [{ $divide: [{ $ifNull: ["$avgResolutionHours", 0] }, 24] }, 1] },
        },
      },
      { $sort: { total: -1 } },
    ]);
    ok(res, rows);
  })
);

router.get(
  "/analytics/trends",
  asyncHandler(async (req, res) => {
    const filter = buildFilter(req);
    const rows = await Grievance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ["$status", GRIEVANCE_COMPLETED_STATUSES] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $project: { _id: 0, year: "$_id.year", month: "$_id.month", total: 1, resolved: 1 } },
    ]);
    ok(res, rows);
  })
);

export const grievancesAnalyticsRouter = router;
