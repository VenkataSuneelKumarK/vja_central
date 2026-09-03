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
