import { Router } from "express";
import { Announcement, IAnnouncement } from "@/models/Announcement";
import { createCrudController } from "@/common/crudFactory";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/common/asyncHandler";
import { paginated } from "@/common/apiResponse";
import { getPageParams } from "@/common/pagination";
import { DELETE_ROLES, WRITE_ROLES, PUBLISH_ROLES, DASHBOARD_ROLES } from "@/common/constants";
import { createAnnouncementSchema, updateAnnouncementSchema, updateStatusSchema } from "./announcements.validation";

const controller = createCrudController<IAnnouncement>({ model: Announcement, entityType: "announcement" });

const router = Router();

// Bespoke public list (rather than the generic controller) so the feed can
// be ordered urgent → important → normal, then newest first — Mongo can't
// sort by an arbitrary enum order without a numeric field on the document.
router.get(
  "/announcements",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPageParams(req);
    const now = new Date();
    const filter = { status: "published", $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] };

    const [items, total] = await Promise.all([
      Announcement.aggregate([
        { $match: filter },
        { $addFields: { priorityRank: { $switch: { branches: [{ case: { $eq: ["$priority", "urgent"] }, then: 0 }, { case: { $eq: ["$priority", "important"] }, then: 1 }], default: 2 } } } },
        { $sort: { priorityRank: 1, publishAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      Announcement.countDocuments(filter),
    ]);
    paginated(res, items, page, limit, total);
  })
);
router.get("/announcements/:id", controller.publicGet);

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get("/", requireRole(DASHBOARD_ROLES), controller.adminList);
adminRouter.get("/:id", requireRole(DASHBOARD_ROLES), controller.adminGet);
adminRouter.post("/", requireRole(WRITE_ROLES), validate(createAnnouncementSchema), controller.adminCreate);
adminRouter.put("/:id", requireRole(WRITE_ROLES), validate(updateAnnouncementSchema), controller.adminUpdate);
adminRouter.patch("/:id/status", requireRole(PUBLISH_ROLES), validate(updateStatusSchema), controller.adminUpdateStatus);
adminRouter.delete("/:id", requireRole(DELETE_ROLES), controller.adminDelete);

export const announcementsPublicRouter = router;
export const announcementsAdminRouter = adminRouter;
