import { Router } from "express";
import { z } from "zod";
import { Notification } from "@/models/Notification";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, paginated, ApiError } from "@/common/apiResponse";
import { getPageParams } from "@/common/pagination";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { writeAuditLog } from "@/common/audit";
import { PUBLISH_ROLES, CONTENT_TYPES } from "@/common/constants";
import { bilingual } from "@/common/validation";
import { sendPushNotification } from "./notifications.service";

const sendSchema = z.object({
  body: z.object({
    title: bilingual(),
    body: bilingual(),
    contentType: z.enum([...CONTENT_TYPES, "general"]),
    contentId: z.string().optional(),
  }),
});

const router = Router();
router.use(requireAuth, requireRole(PUBLISH_ROLES));

router.post(
  "/",
  validate(sendSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { title, body, contentType, contentId } = req.body;

    const result = await sendPushNotification({
      title_en: title.en,
      title_te: title.te,
      body_en: body.en,
      body_te: body.te,
      contentType,
      contentId,
    });

    const notification = await Notification.create({
      title,
      body,
      contentType,
      contentId: contentId ?? undefined,
      status: result.status === "failed" ? "failed" : "sent",
      successCount: result.successCount,
      failureCount: result.failureCount,
      sentBy: req.user.id,
    });

    await writeAuditLog({ req, action: "send_notification", entityType: "notification", entityId: String(notification._id), after: notification });
    ok(res, { notification, pushStatus: result.status }, 201);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPageParams(req);
    const [items, total] = await Promise.all([
      Notification.find().sort({ sentAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(),
    ]);
    paginated(res, items, page, limit, total);
  })
);

export const notificationsAdminRouter = router;
