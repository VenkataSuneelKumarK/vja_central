import { Router } from "express";
import { FilterQuery } from "mongoose";
import { Grievance, IGrievance } from "@/models/Grievance";
import { GrievanceActivity } from "@/models/GrievanceActivity";
import { Officer } from "@/models/Officer";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, paginated, ApiError } from "@/common/apiResponse";
import { getPageParams } from "@/common/pagination";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { writeAuditLog } from "@/common/audit";
import { writeGrievanceTimeline } from "@/common/grievanceTimeline";
import { withSlaState, withSlaStateList } from "@/common/grievanceSerializer";
import { computeDueDate } from "@/common/sla";
import { sendCitizenGrievancePush } from "./grievanceNotifications";
import { GRIEVANCE_MANAGE_ROLES, GRIEVANCE_VIEW_ROLES, GrievancePriority } from "@/common/constants";
import {
  assignGrievanceSchema,
  priorityChangeSchema,
  statusChangeSchema,
  resolveGrievanceSchema,
  rejectGrievanceSchema,
  commentSchema,
} from "./grievances.validation";

const router = Router();
router.use(requireAuth, requireRole(GRIEVANCE_VIEW_ROLES));

function buildAdminFilter(req: import("express").Request): FilterQuery<IGrievance> {
  const filter: FilterQuery<IGrievance> = {};
  const q = req.query;
  if (q.status) filter.status = q.status;
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
  if (q.q) {
    // Plain regex across every searchable field rather than $text: Mongo
    // requires every clause inside an $or that contains $text to also be
    // indexed, which citizenMobile isn't — and a regex also gives more
    // intuitive partial-match behavior (typing part of a mobile number,
    // grievance ID, or name) than $text's whole-word stemming would.
    const search = String(q.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: search, $options: "i" };
    (filter as Record<string, unknown>).$or = [{ heading: regex }, { description: regex }, { citizenName: regex }, { citizenMobile: regex }, { grievanceNumber: regex }];
  }
  return filter;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPageParams(req);
    const filter = buildAdminFilter(req);
    const [items, total] = await Promise.all([
      Grievance.find(filter)
        .populate("category", "name slug")
        .populate("department", "name")
        .populate("assignedOfficer", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Grievance.countDocuments(filter),
    ]);
    paginated(res, withSlaStateList(items), page, limit, total);
  })
);

// Registered before "/:id" — otherwise Express would match "export" as an
// :id param instead of this route. Unlike the paginated list endpoint
// (capped at 100/page via getPageParams), a print/PDF export needs every
// matching record in one response so the document isn't silently missing
// rows past page 1; capped at 5000 as a sanity ceiling rather than left
// unbounded.
router.get(
  "/export",
  asyncHandler(async (req, res) => {
    const filter = buildAdminFilter(req);
    const items = await Grievance.find(filter)
      .populate("category", "name slug")
      .populate("department", "name")
      .populate("assignedOfficer", "name")
      .sort({ createdAt: -1 })
      .limit(5000);
    ok(res, withSlaStateList(items));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const grievance = await Grievance.findById(req.params.id)
      .populate("category", "name slug subCategories")
      .populate("department", "name")
      .populate("assignedOfficer", "name mobile")
      .populate("citizenId", "username mobile fullName");
    if (!grievance) throw ApiError.notFound();
    ok(res, withSlaState(grievance));
  })
);

router.get(
  "/:id/timeline",
  asyncHandler(async (req, res) => {
    // Admin sees the full timeline, public and internal alike.
    const timeline = await GrievanceActivity.find({ grievanceId: req.params.id }).sort({ createdAt: 1 });
    ok(res, timeline);
  })
);

router.post(
  "/:id/comments",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(commentSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { message, isPublic } = req.body as { message: string; isPublic: boolean };
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) throw ApiError.notFound();

    await writeGrievanceTimeline({
      grievanceId: grievance._id,
      action: "comment",
      actorType: "admin",
      actorId: req.user.id,
      actorName: req.user.name,
      message,
      isPublic,
    });

    if (isPublic) {
      await sendCitizenGrievancePush(grievance.citizenId, "Grievance Update", `An update was posted on your grievance ${grievance.grievanceNumber}.`, {
        grievanceId: String(grievance._id),
        grievanceNumber: grievance.grievanceNumber,
      });
    }

    ok(res, { added: true });
  })
);

router.post(
  "/:id/assign",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(assignGrievanceSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { department, assignedOfficer, dueDate, internalNote } = req.body as {
      department: string;
      assignedOfficer?: string;
      dueDate?: Date;
      internalNote?: string;
    };

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) throw ApiError.notFound();

    const before = { department: grievance.department, assignedOfficer: grievance.assignedOfficer, status: grievance.status };

    grievance.department = department as unknown as typeof grievance.department;
    if (assignedOfficer) {
      const officer = await Officer.findById(assignedOfficer);
      grievance.assignedOfficer = assignedOfficer as unknown as typeof grievance.assignedOfficer;
      grievance.assignedOfficerName = officer?.name;
    }
    grievance.assignedBy = req.user.id as unknown as typeof grievance.assignedBy;
    grievance.assignedAt = new Date();
    if (dueDate) {
      grievance.dueDate = dueDate;
      grievance.dueDateOverridden = true;
    }
    if (grievance.status === "open") grievance.status = "assigned";
    grievance.updatedBy = req.user.id as unknown as typeof grievance.updatedBy;
    await grievance.save();

    await writeGrievanceTimeline({
      grievanceId: grievance._id,
      action: "assigned",
      actorType: "admin",
      actorId: req.user.id,
      actorName: req.user.name,
      message: `Assigned${grievance.assignedOfficerName ? ` to ${grievance.assignedOfficerName}` : ""}`,
      isPublic: true,
      metadata: { internalNote },
    });
    if (internalNote) {
      await writeGrievanceTimeline({
        grievanceId: grievance._id,
        action: "comment",
        actorType: "admin",
        actorId: req.user.id,
        actorName: req.user.name,
        message: internalNote,
        isPublic: false,
      });
    }
    await writeAuditLog({ req, action: "assign", entityType: "grievance", entityId: req.params.id, before, after: { department, assignedOfficer, status: grievance.status } });

    await sendCitizenGrievancePush(grievance.citizenId, "Grievance Assigned", `Your grievance ${grievance.grievanceNumber} has been assigned and is being reviewed.`, {
      grievanceId: String(grievance._id),
      grievanceNumber: grievance.grievanceNumber,
      status: grievance.status,
    });

    ok(res, withSlaState(grievance));
  })
);

router.patch(
  "/:id/priority",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(priorityChangeSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { priority, reason } = req.body as { priority: GrievancePriority; reason: string };

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) throw ApiError.notFound();

    const previousPriority = grievance.priority;
    grievance.priority = priority;
    grievance.priorityChangeReason = reason;
    // Recompute the due date from the new priority unless an admin already
    // manually overrode it — an override is a deliberate deadline decision
    // that a later priority tweak shouldn't silently clobber.
    if (!grievance.dueDateOverridden) {
      grievance.dueDate = await computeDueDate(priority, grievance.createdAt);
    }
    grievance.updatedBy = req.user.id as unknown as typeof grievance.updatedBy;
    await grievance.save();

    await writeGrievanceTimeline({
      grievanceId: grievance._id,
      action: "priority_changed",
      actorType: "admin",
      actorId: req.user.id,
      actorName: req.user.name,
      message: `Priority changed from ${previousPriority} to ${priority}: ${reason}`,
      isPublic: false,
      metadata: { from: previousPriority, to: priority, reason },
    });
    await writeAuditLog({ req, action: "priority_change", entityType: "grievance", entityId: req.params.id, before: { priority: previousPriority }, after: { priority, reason } });

    ok(res, withSlaState(grievance));
  })
);

router.patch(
  "/:id/status",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(statusChangeSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { status, note } = req.body as { status: string; note?: string };

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) throw ApiError.notFound();
    if (["resolved", "rejected", "verified", "closed"].includes(status)) {
      throw ApiError.badRequest("Use the dedicated resolve/reject endpoints for this transition");
    }

    const previousStatus = grievance.status;
    grievance.status = status;
    grievance.updatedBy = req.user.id as unknown as typeof grievance.updatedBy;
    await grievance.save();

    await writeGrievanceTimeline({
      grievanceId: grievance._id,
      action: "status_changed",
      actorType: "admin",
      actorId: req.user.id,
      actorName: req.user.name,
      message: note ? `Status changed to ${status}: ${note}` : `Status changed to ${status}`,
      isPublic: true,
      metadata: { from: previousStatus, to: status },
    });
    await writeAuditLog({ req, action: "status_change", entityType: "grievance", entityId: req.params.id, before: { status: previousStatus }, after: { status } });

    await sendCitizenGrievancePush(grievance.citizenId, "Status Update", `Your grievance ${grievance.grievanceNumber} is now ${status.replace(/_/g, " ")}.`, {
      grievanceId: String(grievance._id),
      grievanceNumber: grievance.grievanceNumber,
      status,
    });

    ok(res, withSlaState(grievance));
  })
);

router.post(
  "/:id/resolve",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(resolveGrievanceSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { resolutionDescription, resolutionAttachments } = req.body as {
      resolutionDescription: string;
      resolutionAttachments: Array<{ url: string; thumbnailUrl?: string; mediumUrl?: string; fileName: string; fileType: string }>;
    };

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) throw ApiError.notFound();

    grievance.status = "resolved";
    grievance.resolutionDescription = resolutionDescription;
    grievance.resolutionAttachments = resolutionAttachments.map((a) => ({ ...a, uploadedAt: new Date() }));
    grievance.resolvedAt = new Date();
    grievance.updatedBy = req.user.id as unknown as typeof grievance.updatedBy;
    await grievance.save();

    await writeGrievanceTimeline({
      grievanceId: grievance._id,
      action: "resolved",
      actorType: "admin",
      actorId: req.user.id,
      actorName: req.user.name,
      message: `Resolved: ${resolutionDescription}`,
      isPublic: true,
    });
    await writeAuditLog({ req, action: "resolve", entityType: "grievance", entityId: req.params.id, after: { resolutionDescription } });

    await sendCitizenGrievancePush(grievance.citizenId, "Resolved", `Your grievance ${grievance.grievanceNumber} has been resolved. Please verify the resolution.`, {
      grievanceId: String(grievance._id),
      grievanceNumber: grievance.grievanceNumber,
      status: grievance.status,
    });

    ok(res, withSlaState(grievance));
  })
);

router.post(
  "/:id/reject",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(rejectGrievanceSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { rejectionReason } = req.body as { rejectionReason: string };

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) throw ApiError.notFound();

    grievance.status = "rejected";
    grievance.rejectionReason = rejectionReason;
    grievance.updatedBy = req.user.id as unknown as typeof grievance.updatedBy;
    await grievance.save();

    await writeGrievanceTimeline({
      grievanceId: grievance._id,
      action: "rejected",
      actorType: "admin",
      actorId: req.user.id,
      actorName: req.user.name,
      message: `Rejected: ${rejectionReason}`,
      isPublic: true,
    });
    await writeAuditLog({ req, action: "reject", entityType: "grievance", entityId: req.params.id, after: { rejectionReason } });

    await sendCitizenGrievancePush(grievance.citizenId, "Grievance Update", `Your grievance ${grievance.grievanceNumber} could not be processed: ${rejectionReason}`, {
      grievanceId: String(grievance._id),
      grievanceNumber: grievance.grievanceNumber,
      status: grievance.status,
    });

    ok(res, withSlaState(grievance));
  })
);

export const grievancesAdminRouter = router;
