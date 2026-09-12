# Vijayawada Central — Public Activity & Information App
## Architecture (Phase 1, updated for Phase 6 — Praja Samvad)

## 1. System overview

```
                    ┌───────────────────────┐
                    │    Admin Web Portal     │  React + Vite + TS
                    │   (staff, RBAC-gated)   │
                    └────────────┬────────────┘
                                 │ HTTPS + staff JWT
                                 │ (access + refresh cookie)
                                 ▼
┌────────────────┐   ┌───────────────────────┐   ┌─────────────────────┐
│   Android App    │   │                        │   │    MongoDB           │
│  (React Native)  ├──▶│    Backend REST API     ├──▶│  content, users,     │
├────────────────┤   │   Node.js + Express     │   │  citizens, grievances │
│    iOS App        │   │    + TypeScript         │   └─────────────────────┘
│  (React Native)  ├──▶│                        │
└────────────────┘   └────────────┬────────────┘
      ▲   HTTPS + citizen JWT                    │
      │   (own secrets, own                      ▼
      │   payload — Praja Samvad)      ┌───────────────────────┐
      └── same apps, second                │   AWS S3 / MinIO        │
          token domain                     │   media originals +     │──▶ CDN ──▶ clients
                                            │   thumbnail/medium      │
                                            └───────────────────────┘

Firebase: Cloud Messaging (push — broadcast topics for content,
per-citizen topics for grievance updates)
```

Both mobile apps and the admin portal talk to the **same backend API** — the
admin portal has `/api/admin/*` routes gated by staff JWT + RBAC. No content
is ever bundled into the mobile app; every screen is API-driven.

**Praja Samvad (ప్రజలతో ముఖాముఖి)**, the public grievance-tracking module
added in Phase 6, adds a second, citizen-writable surface on the same API:
citizens register and authenticate independently of staff (a completely
separate JWT domain — see §6), file and track grievances from the mobile
app, and staff triage/assign/resolve them from the admin portal next to the
content tools. Full module architecture, data model, state machine and RBAC
matrix: §10 below; the executable MongoDB collection schema (including every
grievance collection) is in [DB_SCHEMA.md](./DB_SCHEMA.md).

## 2. Technology choices

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native + TypeScript (Expo bare/dev-client) | Single codebase for iOS+Android, matches brief, huge ecosystem for FCM/maps/image viewers |
| Admin portal | React + Vite + TypeScript + Tailwind | Fast dev loop, no SSR needed (internal tool), small bundle |
| Backend | Node.js + Express + TypeScript | Matches brief, same language as frontend (shared types), mature ecosystem |
| Database | MongoDB (Atlas, replica set) via Mongoose | Matches brief; content is document-shaped (multi-language fields, nested media arrays) |
| Object storage | AWS S3 | Durable, cheap, integrates with CloudFront |
| CDN | AWS CloudFront in front of S3 | Image/video delivery, signed URLs optional |
| Image processing | `sharp` in an upload-time worker (or S3 + Lambda) | Generates thumbnail/medium/original variants at upload time, not request time |
| Push notifications | Firebase Cloud Messaging | Cross-platform, matches brief |
| Auth (admin) | JWT (access 15m + refresh 7d), bcrypt password hashing | Standard, stateless, easy to scale horizontally |
| Auth (citizens) | Separate JWT domain (access 1h + refresh 30d), bcrypt password hashing | Own secrets, own payload shape (`tokenType` claim), own Express request property (`req.citizen`) — a citizen token can never authenticate a staff route or vice versa. Username/mobile + password, not OTP. |
| Hosting | AWS ECS Fargate (API containers) behind an ALB | No server management, scales on load, matches "AWS" choice |
| CI/CD | GitHub Actions (Phase 10, deferred per brief) | Deferred but pipeline stubs included |

## 3. Monorepo layout

```
webappWorkspace/
├── backend/                # Node/Express/TS API
├── admin/                  # React/Vite/TS admin portal
├── mobileappWorkspace/     # React Native/TS mobile app
├── docs/                   # this folder — architecture, API, ER, deployment
└── .gitignore
```

There is no shared npm package between `backend` and `admin` — enums (content
status, roles, grievance status/priority) are declared independently in each
and kept in sync by convention, each side commenting where its counterpart
lives. The mobile app keeps its own copies too, deliberately decoupled so
Metro bundling never has to resolve modules outside its project root.

## 4. Data model — see [ERD.md](./ERD.md) and the executable [DB_SCHEMA.md](./DB_SCHEMA.md)

## 5. API contracts — see [API.md](./API.md)

## 6. Security architecture

- **Transport**: HTTPS everywhere (ALB terminates TLS via ACM cert); HTTP→HTTPS redirect.
- **Admin auth**: email+password → bcrypt hash compare → short-lived JWT access
  token (15 min) + long-lived rotating refresh token (7 days, httpOnly cookie
  for the admin portal). Public content endpoints are unauthenticated read-only.
- **Citizen auth (Praja Samvad)**: username/mobile + password → bcrypt hash
  compare → JWT access token (1h) + refresh token (30d). Fully separate
  secrets (`JWT_CITIZEN_ACCESS_SECRET` / `JWT_CITIZEN_REFRESH_SECRET`) from
  admin auth, plus an explicit `tokenType` claim checked on every verify — a
  citizen token can never authenticate an admin route and vice versa, even
  if a verifier were accidentally pointed at the wrong secret. Mobile has no
  browser cookie jar across app restarts, so `refreshToken` is additionally
  returned in the JSON body (register/login/refresh) purely as an addition
  alongside the cookie the admin/web flow still uses.
- **Authorization (RBAC)**: middleware checks `req.user.role` against a
  permission matrix (Super Admin / Content Admin / Editor / Viewer). Every
  admin route — content and grievance alike — declares the roles allowed to
  call it. Citizen routes are never role-gated; they're scoped to
  `req.citizen.id` server-side instead (a citizen only ever sees their own
  data, enforced on every query, not just hidden in the UI).
- **Input validation**: `zod` schemas validate every request body/query
  before it reaches a controller; invalid input → 400 with a generic message.
- **Injection protection**: Mongoose parameterizes queries by default;
  `express-mongo-sanitize` strips `$`/`.` operators from user input as a
  second layer.
- **XSS**: admin-entered rich text is sanitized server-side (`sanitize-html`)
  before storage; React (both admin and mobile-web contexts) escapes by
  default.
- **CSRF**: admin portal uses `SameSite=Strict` cookies for the refresh
  token + a CSRF double-submit token header on state-changing requests.
- **Rate limiting**: `express-rate-limit` with three separate limiters —
  `loginRateLimiter` (strict, staff `/admin/auth/login` only), a dedicated
  `citizenAuthRateLimiter` (more generous — public registration/login volume
  shouldn't compete with the brute-force budget meant for staff accounts) on
  `/citizen/auth/*`, and `apiRateLimiter` (loose) on everything else.
- **Search input**: any user-supplied free-text search (grievance search,
  content search) is regex-escaped server-side before being used in a
  MongoDB query — closes off both query-breaking and ReDoS-style inputs.
- **File upload validation**: MIME-type allow-list (jpg/jpeg/png/webp for
  images; mp4/mov for hosted video), magic-byte sniffing (not just extension),
  configurable max size (`MAX_UPLOAD_MB` env var), files streamed to S3 —
  never written to a web-accessible path. Citizens get their own upload
  endpoint (max 5 files) sharing the same validated pipeline as the admin
  media endpoint (max 20 files), not a duplicated implementation.
- **Secrets**: all secrets via environment variables / AWS Secrets Manager
  in production; `.env` is git-ignored; `.env.example` documents required keys.
- **Index readiness**: the server waits for `mongoose.connection.syncIndexes()`
  after every model is registered, before it starts accepting requests —
  closes a startup race where a fresh deploy or DB seed could 500 on a
  `$text` query until its background index finished building.
- **Audit logging**: every admin create/update/delete/publish/unpublish
  action — content and grievance — writes an `AuditLog` document (actor,
  action, entity, before/after diff, timestamp, IP). A grievance's citizen-
  visible history is a *separate* log (`GrievanceActivity`, append-only,
  filtered by `isPublic`) — the audit trail and what the citizen sees are
  two logs for two audiences, not one log filtered two ways.
- **No secrets in the mobile app**: the mobile app only ever holds the
  public `API_BASE_URL` and a Firebase client config (both non-secret by
  design — FCM sender IDs are not credentials).

## 7. Deployment architecture

```
Route53 → CloudFront (static admin build + API behind /api via ALB origin)
                 │
                 ▼
        Application Load Balancer (TLS via ACM)
                 │
        ┌────────┴─────────┐
        ▼                   ▼
  ECS Fargate service   ECS Fargate service
  (API, autoscaled)     (background worker: media processing,
                          scheduled publish, push notifications)
                 │
                 ▼
      MongoDB Atlas (M10+, replica set, daily backups)
                 │
                 ▼
           AWS S3 (media bucket, versioned)
                 │
                 ▼
          CloudFront (media CDN, cached)
```

Environments: `development` (local Docker Compose: API + Mongo + MinIO
as S3-compatible local storage), `staging`, `production` — each with its
own `.env` / AWS parameter set. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## 8. Mobile navigation — see [MOBILE_NAV.md](./MOBILE_NAV.md)
## 9. Admin portal navigation — see [ADMIN_NAV.md](./ADMIN_NAV.md)

## 10. Grievance module architecture (Praja Samvad)

Built around one funnel, not a ticket queue: **Citizen → Grievance →
Categorization → Priority → Assignment → SLA → Follow-up → Resolution →
Citizen Verification → Closure → Feedback → Analytics** — every grievance is
meant to produce measurable signal (what people ask for, where, how fast it
gets resolved), not just a resolved/unresolved flag.

- **Grievance ID**: `MV-YYYY-NNNNNN`, generated server-side only via an
  atomic MongoDB counter (`findOneAndUpdate` + `$inc`, upsert, one sequence
  per year) — verified concurrency-safe with a 25-way parallel `Promise.all`
  test producing 25 unique, gap-free numbers.
- **Priority**: a citizen's `initialPriority` is preserved forever even
  after staff override the effective `priority` (which requires a
  `priorityChangeReason`) — so over-reporting of severity stays measurable.
- **Status lifecycle**: `open → assigned → in_progress → resolved →
  verified → closed`, with `rejected` (staff-only, reason required) and
  `reopened` (citizen-only, reason required) branching off the main line.
  The generic `PATCH /:id/status` endpoint explicitly refuses
  `resolved | rejected | verified | closed` — those four only happen
  through their own dedicated endpoints, each with required fields the
  generic endpoint doesn't enforce.
- **Closure requires citizen confirmation**: a grievance is never "closed"
  on staff say-so alone — after `resolved`, the citizen either confirms
  (→ `verified` → auto-`closed`) or disputes it (→ `reopened`, with a
  required reason, back to staff).
- **SLA engine**: `dueDate = createdAt + configurable-hours[priority]`,
  hours editable by a super admin (defaults 24h / 72h / 168h / 336h for
  Emergency / High / Normal / Suggestion). SLA state
  (`on_track | due_soon (≤24h) | overdue`) is computed fresh on every read
  against the current time — never stored or synced by a background job.
- **Ownership**: every citizen-facing route is scoped server-side to
  `{ _id, citizenId: req.citizen.id }`. A lookup that fails ownership
  returns a plain `404`, not `403` — deliberately, so a citizen probing
  another grievance ID can't distinguish "not yours" from "doesn't exist."
- **RBAC**: reuses the existing admin role model rather than a second
  system — Super Admin and Content Admin can assign/change
  priority/status/resolve/reject; Editor and Viewer can view only; only
  Super Admin manages departments/officers/SLA config.

Full field-level data model: [DB_SCHEMA.md](./DB_SCHEMA.md) §19–20
(`grievances`, `grievanceactivities`) and the rest of the grievance
collections. API surface: [API.md](./API.md).

## 11. Risks & dependencies

| Risk | Mitigation |
|---|---|
| MongoDB Atlas / AWS account not yet provisioned | Backend runs fully locally via Docker Compose (Mongo + MinIO) with zero code changes needed to point at production later — everything is env-var driven |
| Apple Developer / Google Play accounts needed for store submission | Out of scope for code; documented as a checklist in `docs/STORE_RELEASE.md` — cannot be completed without the account holder's credentials |
| Firebase project not yet created | FCM wiring is stubbed behind `FIREBASE_*` env vars; push simply no-ops until configured |
| Content authenticity (§42 of brief) | No AI content generation is wired into any publish path in this build; every content field is admin-entered and requires an explicit "Publish" action — nothing auto-publishes except *already-approved, scheduled* content at its scheduled time |
| Telugu font rendering on older Android devices | Use a bundled Noto Sans Telugu font via `expo-font` rather than relying on system font coverage |
| Scope size (content phases + the 12-phase Praja Samvad spec) | Built incrementally; the grievance module's core (citizen auth → grievance CRUD → assignment/SLA/status workflow → citizen verification/feedback → admin management) is complete and tested, while analytics dashboards, the ward heat map, CSV/PDF exports, WhatsApp/SMS channels, and an officer-facing app are explicitly deferred — see `docs/TESTING.md` |
| Per-citizen push delivery not fully wired | The backend targets `citizen_<id>` FCM topics, but the mobile app doesn't yet send its device token to a subscription endpoint — matches a pre-existing gap in the original broadcast-only push design, not something the grievance module regressed |
| Citizen personal data now collected (mobile number, optional name) | The original "no personal data collected" assumption in `docs/STORE_RELEASE.md`'s Play Store Data Safety / App Store Privacy sections no longer holds once Praja Samvad ships — both checklists have been updated accordingly |
