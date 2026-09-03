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
