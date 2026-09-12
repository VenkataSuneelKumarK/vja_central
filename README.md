# Mana Vijayawada — Public Activity, Information & Grievance App

A dynamically-managed Android/iOS app for citizen-facing public activity,
event, news, gallery and announcement content, plus **Praja Samvad**
(ప్రజలతో ముఖాముఖి) — a public grievance filing and tracking module — with a
web Admin Portal and a REST backend. Built so new content never requires an
app store release.

## Structure

```
backend/              Node.js + Express + TypeScript + MongoDB API
admin/                React + Vite + TypeScript admin portal
mobileappWorkspace/   React Native + TypeScript mobile app (Expo)
docs/                 Architecture, ER diagram, DB schema, API contracts,
                       deployment, testing, and store-release documentation
```

## Start here

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system overview, tech
  choices, security & deployment architecture, the grievance module
  architecture (§10), risks
- [`docs/ERD.md`](docs/ERD.md) — entity-relationship diagram (content +
  grievance domains)
- [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) — executable MongoDB schema
  (`$jsonSchema` validators + indexes for all 20 collections) — run it
  against a fresh instance to recreate the database structure elsewhere
- [`docs/API.md`](docs/API.md) — REST API contracts, including citizen auth
  and grievance endpoints
- [`docs/MOBILE_NAV.md`](docs/MOBILE_NAV.md) / [`docs/ADMIN_NAV.md`](docs/ADMIN_NAV.md) — navigation maps
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — local dev + AWS production deployment
- [`docs/STORE_RELEASE.md`](docs/STORE_RELEASE.md) — Play Store / App Store checklist
- [`docs/TESTING.md`](docs/TESTING.md) — what's tested and what's not yet

## Quick local start

```bash
# 1. Backend
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev

# 2. Admin portal (new terminal)
cd admin && cp .env.example .env && npm install && npm run dev
# → http://localhost:5173, log in with the seeded super admin (see backend/src/scripts/seed.ts)

# 3. Mobile app (new terminal)
cd mobileappWorkspace && cp .env.example .env && npm install && npm start
```

## Status

The content platform (Activities, Events, News, Photo Albums, Videos,
Announcements, plus categories, notifications, dashboard, RBAC/audit
logging, and configurable branding) has a working implementation across
backend, admin portal, and mobile app.

**Praja Samvad**, the public grievance module, has a complete and tested
core: citizen registration/login (separate auth domain from staff), the
full citizen mobile flow (file a grievance → track status → verify
resolution → rate the outcome), and the full admin flow (list/filter →
assign → SLA-tracked → resolve/reject) — all backed by an immutable
citizen-visible timeline and a separate staff audit trail. Not yet built:
analytics dashboard charts, a ward/area heat map, CSV/PDF exports,
WhatsApp/SMS notification channels, and an officer-facing app — see
`docs/ARCHITECTURE.md` §11 and `docs/TESTING.md` for the full gap list.

See [`docs/TESTING.md`](docs/TESTING.md) for verification status and
[`docs/STORE_RELEASE.md`](docs/STORE_RELEASE.md) for what's still needed
before production infrastructure and store submission (neither AWS/Atlas
nor a Firebase project is provisioned yet — everything runs locally via
Docker Compose today).
