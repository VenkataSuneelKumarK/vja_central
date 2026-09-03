import { Router } from "express";
import { z } from "zod";
import { Category } from "@/models/Category";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { writeAuditLog } from "@/common/audit";
import { WRITE_ROLES, DELETE_ROLES, CONTENT_TYPES } from "@/common/constants";
import { bilingual } from "@/common/validation";

const categorySchema = z.object({
  body: z.object({
    name: bilingual(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, alphanumeric with hyphens"),
    appliesTo: z.array(z.enum(CONTENT_TYPES)).min(1),
    isActive: z.boolean().optional(),
  }),
});

const router = Router();

// Public — read-only, so mobile app filter UIs can populate category chips.
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.appliesTo) filter.appliesTo = req.query.appliesTo;
    const categories = await Category.find(filter).sort({ "name.en": 1 });
    ok(res, categories);
  })
);

const adminRouter = Router();
adminRouter.use(requireAuth);

adminRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await Category.find().sort({ "name.en": 1 });
    ok(res, categories);
  })
);

adminRouter.post(
  "/",
  requireRole(WRITE_ROLES),
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);
    await writeAuditLog({ req, action: "create", entityType: "category", entityId: String(category._id), after: category });
    ok(res, category, 201);
  })
);

adminRouter.put(
  "/:id",
  requireRole(WRITE_ROLES),
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const existing = await Category.findById(req.params.id);
    if (!existing) throw ApiError.notFound();
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await writeAuditLog({ req, action: "update", entityType: "category", entityId: req.params.id, before: existing, after: category });
    ok(res, category);
  })
);

adminRouter.delete(
  "/:id",
  requireRole(DELETE_ROLES),
  asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw ApiError.notFound();
    await writeAuditLog({ req, action: "delete", entityType: "category", entityId: req.params.id, before: category });
    ok(res, { deleted: true });
  })
);

export const categoriesPublicRouter = router;
export const categoriesAdminRouter = adminRouter;
