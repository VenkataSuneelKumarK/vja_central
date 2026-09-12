import { Router } from "express";
import { z } from "zod";
import { GrievanceCategory } from "@/models/GrievanceCategory";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { writeAuditLog } from "@/common/audit";
import { GRIEVANCE_MANAGE_ROLES } from "@/common/constants";
import { bilingual } from "@/common/validation";

const subCategorySchema = z.object({ name: bilingual(), slug: z.string().min(1) });

const categorySchema = z.object({
  body: z.object({
    name: bilingual(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    isOther: z.boolean().optional(),
    subCategories: z.array(subCategorySchema).optional().default([]),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
  }),
});

// Public read — the citizen submission form needs this list before/while
// the citizen is filling out a grievance, same pattern as the existing
// content Category model (configurable, not hard-coded in the app).
export const grievanceCategoriesPublicRouter = Router();
grievanceCategoriesPublicRouter.get(
  "/grievance-categories",
  asyncHandler(async (_req, res) => {
    const categories = await GrievanceCategory.find({ isActive: true }).sort({ sortOrder: 1, "name.en": 1 });
    ok(res, categories);
  })
);

export const grievanceCategoriesAdminRouter = Router();
grievanceCategoriesAdminRouter.use(requireAuth);

grievanceCategoriesAdminRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await GrievanceCategory.find().sort({ sortOrder: 1, "name.en": 1 });
    ok(res, categories);
  })
);

grievanceCategoriesAdminRouter.post(
  "/",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const category = await GrievanceCategory.create(req.body);
    await writeAuditLog({ req, action: "create", entityType: "grievance_category", entityId: String(category._id), after: category });
    ok(res, category, 201);
  })
);

grievanceCategoriesAdminRouter.put(
  "/:id",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const existing = await GrievanceCategory.findById(req.params.id);
    if (!existing) throw ApiError.notFound();
    const category = await GrievanceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await writeAuditLog({ req, action: "update", entityType: "grievance_category", entityId: req.params.id, before: existing, after: category });
    ok(res, category);
  })
);

grievanceCategoriesAdminRouter.delete(
  "/:id",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    const category = await GrievanceCategory.findByIdAndDelete(req.params.id);
    if (!category) throw ApiError.notFound();
    await writeAuditLog({ req, action: "delete", entityType: "grievance_category", entityId: req.params.id, before: category });
    ok(res, { deleted: true });
  })
);
