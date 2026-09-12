import { Role } from "@/types";

// Mirrors backend/src/common/constants.ts — kept in sync manually since the
// admin and API are separate deployable apps (see docs/ARCHITECTURE.md).
export const PUBLISH_ROLES: Role[] = ["super_admin", "content_admin"];
export const DELETE_ROLES: Role[] = ["super_admin", "content_admin"];
export const WRITE_ROLES: Role[] = ["super_admin", "content_admin", "editor"];

export function canWrite(role?: Role): boolean {
  return !!role && WRITE_ROLES.includes(role);
}
export function canPublish(role?: Role): boolean {
  return !!role && PUBLISH_ROLES.includes(role);
}
export function canDelete(role?: Role): boolean {
  return !!role && DELETE_ROLES.includes(role);
}
export function isSuperAdmin(role?: Role): boolean {
  return role === "super_admin";
}

// Mirrors backend/src/common/constants.ts GRIEVANCE_MANAGE_ROLES /
// GRIEVANCE_VIEW_ROLES. Every signed-in admin/staff role can view
// grievances; only super_admin and content_admin can assign, change
// status/priority, resolve, reject, or edit department/officer/SLA config.
export const GRIEVANCE_MANAGE_ROLES: Role[] = ["super_admin", "content_admin"];
export function canManageGrievances(role?: Role): boolean {
  return !!role && GRIEVANCE_MANAGE_ROLES.includes(role);
}
