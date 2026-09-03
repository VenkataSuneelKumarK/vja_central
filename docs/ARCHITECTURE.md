# Vijayawada Central — Public Activity & Information App
## Architecture (Phase 1)

## 1. System overview

```
                    ┌─────────────────────┐
                    │   Admin Web Portal   │  React + Vite + TS
                    │  (content editors)   │
                    └──────────┬───────────┘
                               │ HTTPS + JWT
                               ▼
┌───────────────┐   ┌──────────────────────┐   ┌────────────────────┐
│  Android App   │   │                      │   │   MongoDB Atlas     │
│  (React Native)├──▶│   Backend REST API   ├──▶│   (content, users,  │
├───────────────┤   │  Node.js + Express   │   │   audit logs)       │
│   iOS App      │   │  + TypeScript        │   └────────────────────┘
│  (React Native)├──▶│                      │
└───────────────┘   └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │  AWS S3 (originals)   │
                    │  + Lambda@Edge/Sharp  │──▶ CloudFront CDN ──▶ clients
                    │  (image resize)       │
                    └───────────────────────┘

Firebase: Cloud Messaging (push) [+ optional Firebase Auth for OTP later]
```

Both mobile apps and the admin portal talk to the **same backend API** — the
admin portal additionally has `/api/admin/*` routes gated by JWT + RBAC.
No content is ever bundled into the mobile app; every screen is API-driven.

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
| Auth (admin) | JWT (access + refresh), bcrypt password hashing | Standard, stateless, easy to scale horizontally |
| Auth (citizens, future) | Firebase Auth (phone OTP) | Optional, deferred — app is browsable without login per §14 |
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

`backend` and `admin` share a small `@vja/shared` package (TS types + enums:
categories, status, roles) published as a local file: dependency. The mobile
app keeps its own copy of the same enums (kept intentionally decoupled from
the Node workspace so Metro bundling never has to resolve outside its root).

## 4. Data model — see [ERD.md](./ERD.md)

## 5. API contracts — see [API.md](./API.md)

## 6. Security architecture

- **Transport**: HTTPS everywhere (ALB terminates TLS via ACM cert); HTTP→HTTPS redirect.
- **Admin auth**: email+password → bcrypt hash compare → short-lived JWT access
  token (15 min) + long-lived rotating refresh token (7 days, stored hashed,
  httpOnly cookie for the admin portal). Public mobile endpoints are
  unauthenticated read-only.
- **Authorization (RBAC)**: middleware checks `req.user.role` against a
  permission matrix (see §9 of the brief — Super Admin / Content Admin /
  Editor / Viewer). Every admin route declares the roles allowed to call it.
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
- **Rate limiting**: `express-rate-limit` — stricter on `/api/admin/auth/login`
  (brute-force protection), looser on public GET routes.
- **File upload validation**: MIME-type allow-list (jpg/jpeg/png/webp for
  images; mp4/mov for hosted video), magic-byte sniffing (not just extension),
  configurable max size (`MAX_UPLOAD_MB` env var), files streamed to S3 —
  never written to a web-accessible path.
- **Secrets**: all secrets via environment variables / AWS Secrets Manager
  in production; `.env` is git-ignored; `.env.example` documents required keys.
- **Audit logging**: every admin create/update/delete/publish/unpublish
  action writes an `AuditLog` document (actor, action, entity, before/after
  diff, timestamp, IP).
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

## 10. Risks & dependencies

| Risk | Mitigation |
|---|---|
| MongoDB Atlas / AWS account not yet provisioned | Backend runs fully locally via Docker Compose (Mongo + MinIO) with zero code changes needed to point at production later — everything is env-var driven |
| Apple Developer / Google Play accounts needed for store submission | Out of scope for code; documented as a checklist in `docs/STORE_RELEASE.md` — cannot be completed without the account holder's credentials |
| Firebase project not yet created | FCM wiring is stubbed behind `FIREBASE_*` env vars; push simply no-ops until configured |
| Content authenticity (§42 of brief) | No AI content generation is wired into any publish path in this build; every content field is admin-entered and requires an explicit "Publish" action — nothing auto-publishes except *already-approved, scheduled* content at its scheduled time |
| Telugu font rendering on older Android devices | Use a bundled Noto Sans Telugu font via `expo-font` rather than relying on system font coverage |
| Scope size (this brief spans ~10 phases) | Built incrementally per phase; this session prioritizes a fully working backend + admin portal + mobile app **core** (Activities/Events/News/Gallery/Videos/Announcements) over exhaustive test suites and store assets, which are documented as next steps |
