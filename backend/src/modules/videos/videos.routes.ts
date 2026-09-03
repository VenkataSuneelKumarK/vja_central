import { Router, Request } from "express";
import { FilterQuery } from "mongoose";
import { Video, IVideo } from "@/models/Video";
import { createCrudController } from "@/common/crudFactory";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { DELETE_ROLES, WRITE_ROLES, PUBLISH_ROLES, DASHBOARD_ROLES } from "@/common/constants";
import { createVideoSchema, updateVideoSchema, updateStatusSchema } from "./videos.validation";

function buildPublicFilter(req: Request): FilterQuery<IVideo> {
  const filter: FilterQuery<IVideo> = {};
  if (req.query.category) filter.category = req.query.category as string;
  return filter;
}

const controller = createCrudController<IVideo>({ model: Video, entityType: "video", buildPublicFilter, populate: "category" });

const router = Router();
router.get("/videos", controller.publicList);
router.get("/videos/:id", controller.publicGet);

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get("/", requireRole(DASHBOARD_ROLES), controller.adminList);
adminRouter.get("/:id", requireRole(DASHBOARD_ROLES), controller.adminGet);
adminRouter.post("/", requireRole(WRITE_ROLES), validate(createVideoSchema), controller.adminCreate);
adminRouter.put("/:id", requireRole(WRITE_ROLES), validate(updateVideoSchema), controller.adminUpdate);
adminRouter.patch("/:id/status", requireRole(PUBLISH_ROLES), validate(updateStatusSchema), controller.adminUpdateStatus);
adminRouter.delete("/:id", requireRole(DELETE_ROLES), controller.adminDelete);

export const videosPublicRouter = router;
export const videosAdminRouter = adminRouter;
