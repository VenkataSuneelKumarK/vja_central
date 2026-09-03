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
