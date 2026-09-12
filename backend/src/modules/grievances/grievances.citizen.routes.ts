import { Router } from "express";
import { Grievance } from "@/models/Grievance";
import { GrievanceActivity } from "@/models/GrievanceActivity";
import { GrievanceCategory } from "@/models/GrievanceCategory";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, paginated, ApiError } from "@/common/apiResponse";
import { getPageParams } from "@/common/pagination";
import { requireCitizenAuth } from "@/middleware/citizenAuth";
import { validate } from "@/middleware/validate";
import { nextGrievanceNumber } from "@/common/sequence";
import { computeDueDate } from "@/common/sla";
import { writeGrievanceTimeline } from "@/common/grievanceTimeline";
import { withSlaState, withSlaStateList } from "@/common/grievanceSerializer";
import { sendCitizenGrievancePush } from "./grievanceNotifications";
import { GRIEVANCE_PENDING_STATUSES, GRIEVANCE_COMPLETED_STATUSES, GrievancePriority } from "@/common/constants";
import { createGrievanceSchema, citizenVerifySchema, feedbackSchema } from "./grievances.validation";

const router = Router();
router.use(requireCitizenAuth);

router.post(
  "/",
  validate(createGrievanceSchema),
  asyncHandler(async (req, res) => {
    if (!req.citizen) throw ApiError.unauthorized();
    const body = req.body as {
      heading: string;
      description: string;
      category: string;
      subCategory?: string;
      customCategoryNote?: string;
      priority: GrievancePriority;
      area?: string;
      ward?: string;
      landmark?: string;
      geo?: { lat?: number | null; lng?: number | null };
      attachments: Array<{ url: string; thumbnailUrl?: string; mediumUrl?: string; fileName: string; fileType: string }>;
    };

    const category = await GrievanceCategory.findById(body.category);
    if (!category || !category.isActive) throw ApiError.badRequest("Invalid category");

    const now = new Date();
    const year = now.getFullYear();
    const { grievanceNumber, sequenceNumber } = await nextGrievanceNumber(year);
    const dueDate = await computeDueDate(body.priority, now);

    const grievance = await Grievance.create({
      grievanceNumber,
      year,
      sequenceNumber,
      citizenId: req.citizen.id,
      citizenName: req.citizen.fullName || req.citizen.username,
      citizenMobile: req.citizen.mobile,
      heading: body.heading,
      description: body.description,
      category: category._id,
      subCategory: body.subCategory,
      customCategoryNote: body.customCategoryNote,
      initialPriority: body.priority,
      priority: body.priority,
      status: "open",
      area: body.area,
      ward: body.ward,
      landmark: body.landmark,
      geo: { lat: body.geo?.lat ?? null, lng: body.geo?.lng ?? null },
      attachments: body.attachments.map((a) => ({ ...a, uploadedAt: now })),
      dueDate,
      createdBy: req.citizen.id,
    });

    await writeGrievanceTimeline({
      grievanceId: grievance._id,
      action: "submitted",
      actorType: "citizen",
      actorId: req.citizen.id,
      actorName: grievance.citizenName,
      message: "Grievance submitted",
      isPublic: true,
    });

    await sendCitizenGrievancePush(req.citizen.id, "Grievance Submitted", `Your grievance ${grievanceNumber} has been registered successfully.`, {
      grievanceId: String(grievance._id),
      grievanceNumber,
      status: grievance.status,
    });

    ok(res, withSlaState(grievance), 201);
  })
);

router.get(
  "/my",
  asyncHandler(async (req, res) => {
    if (!req.citizen) throw ApiError.unauthorized();
    const { page, limit, skip } = getPageParams(req);

    const filterParam = String(req.query.filter ?? "all");
    const statusFilter: Record<string, unknown> = { citizenId: req.citizen.id };
    if (filterParam === "pending") statusFilter.status = { $in: GRIEVANCE_PENDING_STATUSES };
    else if (filterParam === "completed") statusFilter.status = { $in: GRIEVANCE_COMPLETED_STATUSES };

    const [items, total] = await Promise.all([
      Grievance.find(statusFilter).populate("category", "name slug").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Grievance.countDocuments(statusFilter),
    ]);
    paginated(res, withSlaStateList(items), page, limit, total);
  })
);

router.get(
  "/my/:id",
  asyncHandler(async (req, res) => {
    if (!req.citizen) throw ApiError.unauthorized();
    const grievance = await Grievance.findOne({ _id: req.params.id, citizenId: req.citizen.id }).populate("category", "name slug").populate("department", "name").populate("assignedOfficer", "name");
    if (!grievance) throw ApiError.notFound();
    ok(res, withSlaState(grievance));
  })
);

router.get(
  "/my/:id/timeline",
  asyncHandler(async (req, res) => {
    if (!req.citizen) throw ApiError.unauthorized();
    const grievance = await Grievance.findOne({ _id: req.params.id, citizenId: req.citizen.id }).select("_id");
    if (!grievance) throw ApiError.notFound();

    // Citizens only ever see public entries — internal admin notes are
    // filtered out server-side, never just hidden in the UI (§24/§41).
    const timeline = await GrievanceActivity.find({ grievanceId: grievance._id, isPublic: true }).sort({ createdAt: 1 });
    ok(res, timeline);
  })
);

router.post(
  "/my/:id/verify",
  validate(citizenVerifySchema),
  asyncHandler(async (req, res) => {
    if (!req.citizen) throw ApiError.unauthorized();
    const { resolved, reopenReason } = req.body as { resolved: boolean; reopenReason?: string };

    const grievance = await Grievance.findOne({ _id: req.params.id, citizenId: req.citizen.id });
    if (!grievance) throw ApiError.notFound();
    if (grievance.status !== "resolved") throw ApiError.badRequest("Only a resolved grievance can be verified");

    if (resolved) {
      grievance.status = "verified";
      grievance.verifiedAt = new Date();
      await grievance.save();
      await writeGrievanceTimeline({
        grievanceId: grievance._id,
        action: "verified",
        actorType: "citizen",
        actorId: req.citizen.id,
        actorName: grievance.citizenName,
        message: "Citizen verified the resolution",
        isPublic: true,
      });
      // §26: verified grievances still require an explicit Closed state —
      // closing here immediately since this app doesn't have a separate
      // manual-close step for the citizen; the distinction is preserved
      // in the timeline (Verified, then Closed) even though they happen
      // together from the citizen's one tap.
      grievance.status = "closed";
      grievance.closedAt = new Date();
      await grievance.save();
      await writeGrievanceTimeline({
        grievanceId: grievance._id,
        action: "closed",
        actorType: "system",
        actorName: "System",
        message: "Grievance closed after citizen verification",
        isPublic: true,
      });
    } else {
      if (!reopenReason) throw ApiError.badRequest("Please describe why the issue is not resolved");
      grievance.status = "reopened";
      grievance.reopenReason = reopenReason;
      grievance.reopenCount += 1;
      grievance.resolvedAt = null;
      await grievance.save();
      await writeGrievanceTimeline({
        grievanceId: grievance._id,
        action: "reopened",
        actorType: "citizen",
        actorId: req.citizen.id,
        actorName: grievance.citizenName,
        message: `Citizen reopened the grievance: ${reopenReason}`,
        isPublic: true,
      });
    }

    ok(res, withSlaState(grievance));
  })
);

router.post(
  "/my/:id/feedback",
  validate(feedbackSchema),
  asyncHandler(async (req, res) => {
    if (!req.citizen) throw ApiError.unauthorized();
    const { rating, comment } = req.body as { rating: number; comment?: string };

    const grievance = await Grievance.findOne({ _id: req.params.id, citizenId: req.citizen.id });
    if (!grievance) throw ApiError.notFound();
    if (grievance.status !== "closed") throw ApiError.badRequest("Feedback can only be submitted once a grievance is closed");

    grievance.citizenRating = rating;
    grievance.citizenFeedback = comment;
    await grievance.save();

    await writeGrievanceTimeline({
      grievanceId: grievance._id,
      action: "feedback",
      actorType: "citizen",
      actorId: req.citizen.id,
      actorName: grievance.citizenName,
      message: `Citizen rated this ${rating}/5${comment ? `: ${comment}` : ""}`,
      isPublic: false,
    });

    ok(res, withSlaState(grievance));
  })
);

export const grievancesCitizenRouter = router;
