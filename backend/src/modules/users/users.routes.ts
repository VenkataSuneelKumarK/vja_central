import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "@/models/User";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { writeAuditLog } from "@/common/audit";
import { ROLES } from "@/common/constants";

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(ROLES),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
  }),
});

const router = Router();
// User/role management is super_admin only (§15 of the brief).
router.use(requireAuth, requireRole(["super_admin"]));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    ok(res, users);
  })
);

router.post(
  "/",
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict("A user with this email already exists");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });
    await writeAuditLog({ req, action: "create", entityType: "user", entityId: String(user._id), after: { name, email, role } });

    const safeUser = await User.findById(user._id).select("-passwordHash");
    ok(res, safeUser, 201);
  })
);

router.put(
  "/:id",
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const existing = await User.findById(req.params.id);
    if (!existing) throw ApiError.notFound();

    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select("-passwordHash");
    await writeAuditLog({ req, action: "update", entityType: "user", entityId: req.params.id, before: { role: existing.role, isActive: existing.isActive }, after: req.body });
    ok(res, user);
  })
);

export const usersAdminRouter = router;
