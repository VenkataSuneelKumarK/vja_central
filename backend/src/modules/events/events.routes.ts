import { Router, Request } from "express";
import { FilterQuery } from "mongoose";
import { Event, IEvent } from "@/models/Event";
import { createCrudController } from "@/common/crudFactory";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { DELETE_ROLES, WRITE_ROLES, PUBLISH_ROLES, DASHBOARD_ROLES } from "@/common/constants";
import { createEventSchema, updateEventSchema, updateStatusSchema } from "./events.validation";

// Supports ?when=upcoming|today|past on top of the generic published filter.
function buildPublicFilter(req: Request): FilterQuery<IEvent> {
  const filter: FilterQuery<IEvent> = {};
  const when = req.query.when as string | undefined;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  if (when === "today") filter.date = { $gte: startOfToday, $lte: endOfToday };
  else if (when === "upcoming") filter.date = { $gt: endOfToday };
  else if (when === "past") filter.date = { $lt: startOfToday };

  if (req.query.q) (filter as Record<string, unknown>).$text = { $search: String(req.query.q) };
  return filter;
}

const controller = createCrudController<IEvent>({
  model: Event,
  entityType: "event",
  buildPublicFilter,
  defaultSort: { date: 1 },
});

const router = Router();
router.get("/events", controller.publicList);
router.get("/events/:id", controller.publicGet);

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get("/", requireRole(DASHBOARD_ROLES), controller.adminList);
adminRouter.get("/:id", requireRole(DASHBOARD_ROLES), controller.adminGet);
adminRouter.post("/", requireRole(WRITE_ROLES), validate(createEventSchema), controller.adminCreate);
adminRouter.put("/:id", requireRole(WRITE_ROLES), validate(updateEventSchema), controller.adminUpdate);
adminRouter.patch("/:id/status", requireRole(PUBLISH_ROLES), validate(updateStatusSchema), controller.adminUpdateStatus);
adminRouter.delete("/:id", requireRole(DELETE_ROLES), controller.adminDelete);

export const eventsPublicRouter = router;
export const eventsAdminRouter = adminRouter;
