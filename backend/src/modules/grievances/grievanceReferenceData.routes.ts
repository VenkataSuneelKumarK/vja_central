import { Router } from "express";
import { z } from "zod";
import { Department } from "@/models/Department";
import { Officer } from "@/models/Officer";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { writeAuditLog } from "@/common/audit";
import { GRIEVANCE_MANAGE_ROLES, GRIEVANCE_VIEW_ROLES } from "@/common/constants";
import { bilingual, objectId } from "@/common/validation";
import { getGrievanceSlaConfig } from "@/common/sla";
import { GrievanceSlaConfig } from "@/models/GrievanceSlaConfig";
import { slaConfigSchema } from "./grievances.validation";

const departmentSchema = z.object({ body: z.object({ name: bilingual(), isActive: z.boolean().optional() }) });
const officerSchema = z.object({ body: z.object({ name: z.string().min(1), mobile: z.string().optional(), department: objectId, isActive: z.boolean().optional() }) });

export const departmentsAdminRouter = Router();
departmentsAdminRouter.use(requireAuth, requireRole(GRIEVANCE_VIEW_ROLES));

departmentsAdminRouter.get(
  "/",
  asyncHandler(async (_req, res) => ok(res, await Department.find().sort({ "name.en": 1 })))
);
departmentsAdminRouter.post(
  "/",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(departmentSchema),
  asyncHandler(async (req, res) => {
    const department = await Department.create(req.body);
    await writeAuditLog({ req, action: "create", entityType: "department", entityId: String(department._id), after: department });
    ok(res, department, 201);
  })
);
departmentsAdminRouter.put(
  "/:id",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(departmentSchema),
  asyncHandler(async (req, res) => {
    const existing = await Department.findById(req.params.id);
    if (!existing) throw ApiError.notFound();
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await writeAuditLog({ req, action: "update", entityType: "department", entityId: req.params.id, before: existing, after: department });
    ok(res, department);
  })
);

export const officersAdminRouter = Router();
officersAdminRouter.use(requireAuth, requireRole(GRIEVANCE_VIEW_ROLES));

officersAdminRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.department) filter.department = req.query.department;
    ok(res, await Officer.find(filter).populate("department", "name").sort({ name: 1 }));
  })
);
officersAdminRouter.post(
  "/",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(officerSchema),
  asyncHandler(async (req, res) => {
    const officer = await Officer.create(req.body);
    await writeAuditLog({ req, action: "create", entityType: "officer", entityId: String(officer._id), after: officer });
    ok(res, officer, 201);
  })
);
officersAdminRouter.put(
  "/:id",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(officerSchema),
  asyncHandler(async (req, res) => {
    const existing = await Officer.findById(req.params.id);
    if (!existing) throw ApiError.notFound();
    const officer = await Officer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await writeAuditLog({ req, action: "update", entityType: "officer", entityId: req.params.id, before: existing, after: officer });
    ok(res, officer);
  })
);

export const grievanceSlaConfigAdminRouter = Router();
grievanceSlaConfigAdminRouter.use(requireAuth, requireRole(GRIEVANCE_VIEW_ROLES));

grievanceSlaConfigAdminRouter.get(
  "/",
  asyncHandler(async (_req, res) => ok(res, await getGrievanceSlaConfig()))
);
grievanceSlaConfigAdminRouter.put(
  "/",
  requireRole(GRIEVANCE_MANAGE_ROLES),
  validate(slaConfigSchema),
  asyncHandler(async (req, res) => {
    const before = await getGrievanceSlaConfig();
    const updated = await GrievanceSlaConfig.findByIdAndUpdate("grievance_sla_config", req.body, { new: true, upsert: true, runValidators: true });
    await writeAuditLog({ req, action: "update", entityType: "grievance_sla_config", entityId: "grievance_sla_config", before, after: updated });
    ok(res, updated);
  })
);
