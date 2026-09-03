import { Router, Request } from "express";
import { FilterQuery } from "mongoose";
import { News, INews } from "@/models/News";
import { createCrudController } from "@/common/crudFactory";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { DELETE_ROLES, WRITE_ROLES, PUBLISH_ROLES, DASHBOARD_ROLES } from "@/common/constants";
import { createNewsSchema, updateNewsSchema, updateStatusSchema } from "./news.validation";

function buildPublicFilter(req: Request): FilterQuery<INews> {
  const filter: FilterQuery<INews> = {};
  if (req.query.category) filter.category = req.query.category as string;
  if (req.query.q) (filter as Record<string, unknown>).$text = { $search: String(req.query.q) };
  return filter;
}

const controller = createCrudController<INews>({ model: News, entityType: "news", buildPublicFilter, populate: "category" });

const router = Router();
router.get("/news", controller.publicList);
router.get("/news/:id", controller.publicGet);

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get("/", requireRole(DASHBOARD_ROLES), controller.adminList);
adminRouter.get("/:id", requireRole(DASHBOARD_ROLES), controller.adminGet);
adminRouter.post("/", requireRole(WRITE_ROLES), validate(createNewsSchema), controller.adminCreate);
adminRouter.put("/:id", requireRole(WRITE_ROLES), validate(updateNewsSchema), controller.adminUpdate);
adminRouter.patch("/:id/status", requireRole(PUBLISH_ROLES), validate(updateStatusSchema), controller.adminUpdateStatus);
adminRouter.delete("/:id", requireRole(DELETE_ROLES), controller.adminDelete);

export const newsPublicRouter = router;
export const newsAdminRouter = adminRouter;
