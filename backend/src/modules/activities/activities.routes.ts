import { Router } from "express";
import { Request } from "express";
import { FilterQuery } from "mongoose";
import { Activity, IActivity } from "@/models/Activity";
import { createCrudController } from "@/common/crudFactory";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { DELETE_ROLES, WRITE_ROLES, PUBLISH_ROLES, DASHBOARD_ROLES } from "@/common/constants";
import { createActivitySchema, updateActivitySchema, updateStatusSchema } from "./activities.validation";

function buildPublicFilter(req: Request): FilterQuery<IActivity> {
  const filter: FilterQuery<IActivity> = {};
  if (req.query.category) filter.category = req.query.category as string;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) (filter.date as Record<string, Date>).$gte = new Date(String(req.query.from));
    if (req.query.to) (filter.date as Record<string, Date>).$lte = new Date(String(req.query.to));
  }
  if (req.query.q) {
    (filter as Record<string, unknown>).$text = { $search: String(req.query.q) };
  }
  return filter;
}

const controller = createCrudController<IActivity>({
  model: Activity,
  entityType: "activity",
  buildPublicFilter,
  populate: "category",
});

const router = Router();

// --- Public ---
router.get("/activities", controller.publicList);
router.get("/activities/:id", controller.publicGet);

// --- Admin ---
const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get("/", requireRole(DASHBOARD_ROLES), controller.adminList);
adminRouter.get("/:id", requireRole(DASHBOARD_ROLES), controller.adminGet);
adminRouter.post("/", requireRole(WRITE_ROLES), validate(createActivitySchema), controller.adminCreate);
adminRouter.put("/:id", requireRole(WRITE_ROLES), validate(updateActivitySchema), controller.adminUpdate);
adminRouter.patch("/:id/status", requireRole(PUBLISH_ROLES), validate(updateStatusSchema), controller.adminUpdateStatus);
adminRouter.delete("/:id", requireRole(DELETE_ROLES), controller.adminDelete);

export const activitiesPublicRouter = router;
export const activitiesAdminRouter = adminRouter;
