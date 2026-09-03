import { Router } from "express";
import { AuditLog } from "@/models/AuditLog";
import { asyncHandler } from "@/common/asyncHandler";
import { paginated } from "@/common/apiResponse";
import { getPageParams } from "@/common/pagination";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";

const router = Router();
// Full audit trail is super_admin only (§15 of the brief).
router.use(requireAuth, requireRole(["super_admin"]));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPageParams(req);
    const filter: Record<string, unknown> = {};
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.actorId) filter.actorId = req.query.actorId;

    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    paginated(res, items, page, limit, total);
  })
);

export const auditAdminRouter = router;
