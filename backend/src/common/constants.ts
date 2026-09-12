export const ROLES = ["super_admin", "content_admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const CONTENT_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const ANNOUNCEMENT_PRIORITIES = ["normal", "important", "urgent"] as const;
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];

export const CONTENT_TYPES = ["activity", "event", "news", "album", "video", "announcement"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

// Roles allowed to publish/unpublish/archive/delete content.
// Editors may only create/edit drafts (per §15 of the brief).
export const PUBLISH_ROLES: Role[] = ["super_admin", "content_admin"];
export const DELETE_ROLES: Role[] = ["super_admin", "content_admin"];
export const WRITE_ROLES: Role[] = ["super_admin", "content_admin", "editor"];
export const DASHBOARD_ROLES: Role[] = ["super_admin", "content_admin", "editor", "viewer"];

// --- Praja Samvad / Grievance module ---
// Deliberately separate from the content-publishing enums above — a
// grievance is a multi-actor workflow (citizen + staff), not a
// draft/publish content item, so it gets its own status machine.
export const GRIEVANCE_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "verified",
  "reopened",
  "closed",
  "rejected",
] as const;
export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];

// Statuses that count as "Pending" vs "Completed" on the citizen's My
// Grievances screen (§6/§57 of the spec).
export const GRIEVANCE_PENDING_STATUSES: GrievanceStatus[] = ["open", "assigned", "in_progress", "reopened"];
export const GRIEVANCE_COMPLETED_STATUSES: GrievanceStatus[] = ["resolved", "verified", "closed"];

export const GRIEVANCE_PRIORITIES = ["emergency", "high", "normal", "suggestion"] as const;
export type GrievancePriority = (typeof GRIEVANCE_PRIORITIES)[number];

// Every administrative grievance action (assign/reassign/priority/status/
// resolve/reject) requires at least content_admin — editors can staff
// public content but not adjudicate citizen complaints. Kept as its own
// constant (not reusing WRITE_ROLES) so grievance permissions can diverge
// from content permissions without an accidental coupling.
export const GRIEVANCE_MANAGE_ROLES: Role[] = ["super_admin", "content_admin"];
export const GRIEVANCE_VIEW_ROLES: Role[] = ["super_admin", "content_admin", "editor", "viewer"];
