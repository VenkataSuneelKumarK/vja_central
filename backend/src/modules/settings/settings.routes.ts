import { Router } from "express";
import { z } from "zod";
import { AppSettings } from "@/models/AppSettings";
import { asyncHandler } from "@/common/asyncHandler";
import { ok } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { writeAuditLog } from "@/common/audit";

const SETTINGS_ID = "app_settings";

async function getOrCreateSettings() {
  const existing = await AppSettings.findById(SETTINGS_ID);
  if (existing) return existing;
  return AppSettings.create({ _id: SETTINGS_ID });
}

const updateSettingsSchema = z.object({
  body: z.object({
    logoUrl: z.string().url().optional(),
    profileImageUrl: z.string().url().optional(),
    splashImageUrl: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    dashboardStyle: z.enum(["classic", "accent"]).optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactAddress: z.string().optional(),
    socialLinks: z
      .object({
        facebook: z.string().url().optional().or(z.literal("")),
        twitter: z.string().url().optional().or(z.literal("")),
        instagram: z.string().url().optional().or(z.literal("")),
        youtube: z.string().url().optional().or(z.literal("")),
      })
      .optional(),
    privacyPolicyUrl: z.string().url().optional().or(z.literal("")),
    termsUrl: z.string().url().optional().or(z.literal("")),
  }),
});

export const settingsPublicRouter = Router();
// Public — the mobile app fetches branding/contact info on launch (§26).
settingsPublicRouter.get(
  "/app-settings",
  asyncHandler(async (_req, res) => {
    const settings = await getOrCreateSettings();
    ok(res, settings);
  })
);

export const settingsAdminRouter = Router();
settingsAdminRouter.use(requireAuth, requireRole(["super_admin"]));

settingsAdminRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    ok(res, await getOrCreateSettings());
  })
);

settingsAdminRouter.put(
  "/",
  validate(updateSettingsSchema),
  asyncHandler(async (req, res) => {
    const before = await getOrCreateSettings();
    const updated = await AppSettings.findByIdAndUpdate(SETTINGS_ID, req.body, { new: true, upsert: true, runValidators: true });
    await writeAuditLog({ req, action: "update", entityType: "app_settings", entityId: SETTINGS_ID, before, after: updated });
    ok(res, updated);
  })
);
