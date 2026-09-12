# API Contracts

Base URL: `${API_BASE_URL}/api` (e.g. `https://api.vjacentral.example.com/api`)
All responses: `{ success: boolean, data?: T, error?: { message, code } }`
Public endpoints are cached at the CDN/edge for 60s where noted.

## Auth (admin)

| Method | Path | Auth | Body / Notes |
|---|---|---|---|
| POST | `/admin/auth/login` | none (rate-limited) | `{ email, password }` → `{ accessToken, user }` + sets httpOnly refresh cookie |
| POST | `/admin/auth/refresh` | refresh cookie | → new `accessToken` |
| POST | `/admin/auth/logout` | refresh cookie | clears cookie |
| GET | `/admin/auth/me` | JWT | current user + role |

## Auth (citizen — Praja Samvad)

Fully separate token domain from admin auth — see `ARCHITECTURE.md` §6.

| Method | Path | Auth | Body / Notes |
|---|---|---|---|
| POST | `/citizen/auth/register` | none (rate-limited: `citizenAuthRateLimiter`) | `{ username, mobile, password, confirmPassword, fullName? }` → `{ accessToken, refreshToken, citizen }`, sets a refresh cookie too. Auto-authenticates — no forced second login. |
| POST | `/citizen/auth/login` | none (rate-limited) | `{ identifier, password }` (identifier = username or mobile) → same shape as register |
| POST | `/citizen/auth/refresh` | refresh cookie **or** `{ refreshToken }` in body (mobile) | → new `accessToken` |
| POST | `/citizen/auth/logout` | — | clears the refresh cookie |
| GET | `/citizen/auth/me` | citizen JWT | current citizen profile |

## Public — Home

| Method | Path | Notes |
|---|---|---|
| GET | `/home` | Aggregated: `{ latestActivities[5], upcomingEvents[5], latestNews[5], activeAnnouncements[], featuredAlbums[5], featuredVideos[5] }`. One round trip for the whole home screen. Cached 60s. |

## Public — Activities

| Method | Path | Query params |
|---|---|---|
| GET | `/activities` | `page, limit, category, from, to, q` — published only, newest first |
| GET | `/activities/:id` | — |

## Admin — Activities (roles: super_admin, content_admin, editor*)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/activities` | includes drafts/scheduled/archived, all roles with dashboard access |
| POST | `/admin/activities` | create (editor creates as `draft` only) |
| PUT | `/admin/activities/:id` | update |
| PATCH | `/admin/activities/:id/status` | `{ status }` — publish/unpublish/archive; editor blocked unless granted publish permission |
| DELETE | `/admin/activities/:id` | super_admin, content_admin only |

The same five-route shape (`GET list`, `GET :id`, `POST`, `PUT :id`,
`PATCH :id/status`, `DELETE :id`) repeats for **Events, News, Albums,
Videos, Announcements** under `/admin/{resource}` — implemented via a
shared generic controller factory (see `backend/src/modules/*`) so behavior
stays consistent across content types.

## Public — Events / News / Gallery / Videos / Announcements

| Method | Path | Notes |
|---|---|---|
| GET | `/events` | `?when=upcoming|today|past&page&limit` |
| GET | `/events/:id` | — |
| GET | `/news` | `?category&page&limit&q` |
| GET | `/news/:id` | — |
| GET | `/albums` | `?page&limit` — published only |
| GET | `/albums/:id/photos` | `?page&limit` — paginated, never the whole album at once |
| GET | `/videos` | `?category&page&limit` |
| GET | `/announcements` | active (not expired) + published, sorted by priority then date |

## Grievances (Praja Samvad) — citizen self-service

All routes require a citizen JWT and are always scoped server-side to the
calling citizen — never trust (or accept) a client-supplied citizen id.

| Method | Path | Notes |
|---|---|---|
| GET | `/grievance-categories` | public — the 7-category/sub-category taxonomy, `isActive` only |
| POST | `/grievances` | `{ heading, description, category, subCategory?, customCategoryNote?, priority, area?, ward?, landmark?, geo?, attachments? }` → creates with server-generated `grievanceNumber`, computed `dueDate`; 201 |
| GET | `/grievances/my` | `?filter=pending\|completed\|all&page&limit` — paginated, own grievances only |
| GET | `/grievances/my/:id` | 404 (not 403) if not found or not owned — never leaks existence of another citizen's grievance |
| GET | `/grievances/my/:id/timeline` | public (`isPublic: true`) timeline entries only |
| POST | `/grievances/my/:id/verify` | `{ resolved: true }` → verified→closed; `{ resolved: false, reopenReason }` → reopened. Only valid when status is `resolved`. |
| POST | `/grievances/my/:id/feedback` | `{ rating: 1-5, comment? }` — only once status is `closed` |
| POST | `/grievances/attachments` | multipart, field `files`, max 5 images — citizen-scoped counterpart of `/admin/media/upload` (max 20), same validated `sharp` pipeline |

## Admin — Grievances (Praja Samvad)

Read routes: any of `super_admin \| content_admin \| editor \| viewer`.
Write/action routes: `super_admin \| content_admin` only.

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/grievances` | `?status&priority&category&subCategory&ward&area&department&assignedOfficer&from&to&q&page&limit` — `q` searches heading/description/citizenName/citizenMobile/grievanceNumber via regex, not `$text` (mobile number search needs to be a full field, not a text-indexed one) |
| GET | `/admin/grievances/:id` | full detail, populated category/department/officer |
| GET | `/admin/grievances/:id/timeline` | full timeline, both public updates and internal notes |
| POST | `/admin/grievances/:id/comments` | `{ message, isPublic }` — writes a timeline entry only, doesn't change the grievance document |
| POST | `/admin/grievances/:id/assign` | `{ department, assignedOfficer?, dueDate?, internalNote? }` — auto-advances `open→assigned`; `dueDate` sets `dueDateOverridden: true` |
| PATCH | `/admin/grievances/:id/priority` | `{ priority, reason }` — `reason` required; recomputes `dueDate` unless already overridden |
| PATCH | `/admin/grievances/:id/status` | `{ status, note? }` — **rejects** `resolved\|rejected\|verified\|closed`; use the dedicated endpoints below for those |
| POST | `/admin/grievances/:id/resolve` | `{ resolutionDescription, resolutionAttachments? }` → status `resolved` |
| POST | `/admin/grievances/:id/reject` | `{ rejectionReason }` → status `rejected` |
| GET | `/admin/grievances/dashboard` | same filter params as the list — KPIs: total/resolved/pending/overdue, resolution rate, avg resolution days, priority breakdown. **Mounted before** `/admin/grievances/:id` (fixed paths before `:id`, or Express reads `"dashboard"` as an id) |
| GET | `/admin/grievances/analytics/category` \| `/analytics/ward` \| `/analytics/department` \| `/analytics/trends` | aggregation endpoints, same filter shape; no admin UI built on top of these yet (see `docs/TESTING.md`) |
| GET/POST/PUT | `/admin/grievance-categories` | category/sub-category CRUD; POST/PUT need `super_admin\|content_admin` |
| GET/POST/PUT | `/admin/grievance-departments` | department CRUD |
| GET/POST/PUT | `/admin/grievance-officers` | `?department=` filter on GET; officer CRUD |
| GET/PUT | `/admin/grievance-sla-config` | the singleton `{emergencyHours, highHours, normalHours, suggestionHours}` — `super_admin` only for PUT |

## Public — Search & Categories

| Method | Path | Notes |
|---|---|---|
| GET | `/search` | `?q&type=activity|event|news|announcement|photo|video&category&from&to&location` — fans out to a Mongo text-index query per requested type |
| GET | `/categories` | `?appliesTo=activity` — admin-configurable category list |

## Admin — Notifications

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/notifications` | `{ title_en, title_te, body_en, body_te, contentType, contentId }` → sends FCM push to `activity_updates` topic, logs `Notification` doc |
| GET | `/admin/notifications` | send history + delivery stats |

## Admin — Dashboard

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard/stats` | counts: total/today activities, total/upcoming events, total photos, total videos, total announcements, app install count (from a lightweight `AppInstall` ping, opt-in, no PII), notification stats, 10 most recently published items across all types |

## Admin — Users & Roles (super_admin only)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users` | list |
| POST | `/admin/users` | create admin user + role |
| PUT | `/admin/users/:id` | edit role / deactivate |

## Conventions

- All list endpoints are paginated: `{ items[], page, limit, total, hasMore }`.
- All admin write endpoints require `Authorization: Bearer <accessToken>`
  and are checked against a per-route role allow-list.
- All mutating admin actions write an `AuditLog` entry server-side —
  callers never pass audit data explicitly.
- Media upload: `POST /admin/media/upload` (multipart) — validates
  type/size, uploads original to S3, generates `thumbnail` (200px),
  `medium` (800px) and keeps `original`, returns all three URLs for the
  caller to attach to a content document. Kept as its own endpoint (rather
  than inline in each content POST) so the admin UI can upload images while
  the user is still typing the rest of the form.
- Grievance routes use **two separate JWTs**, not one shared token with a
  role check — `Authorization: Bearer <citizen access token>` for
  `/grievances/*` (citizen self-service) vs. `Authorization: Bearer <staff
  access token>` for `/admin/grievances/*`. See `ARCHITECTURE.md` §6.
- A grievance mutation writes to **two different logs**, not one: an
  `AuditLog` entry (staff-only, same as any other admin action) and a
  `GrievanceActivity` timeline entry (citizen-visible when `isPublic: true`)
  — callers never write either explicitly, both are side effects of the
  action endpoint.
