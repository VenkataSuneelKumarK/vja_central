# Vijayawada Central — Public Activity & Information App

A dynamically-managed Android/iOS app for citizen-facing public activity,
event, news, gallery and announcement content, with a web Admin Portal and
a REST backend — built so new content never requires an app store release.

## Structure

```
backend/              Node.js + Express + TypeScript + MongoDB API
admin/                React + Vite + TypeScript admin portal
mobileappWorkspace/   React Native + TypeScript mobile app (Expo)
docs/                 Architecture, ER diagram, API contracts, deployment,
                       testing, and store-release documentation
```

## Start here

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system overview, tech
  choices, security & deployment architecture, risks
- [`docs/ERD.md`](docs/ERD.md) — database schema
- [`docs/API.md`](docs/API.md) — REST API contracts
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

Phases 1–5 (architecture, backend, admin portal, mobile app, integration)
have a working implementation for the core content types: Activities,
Events, News, Photo Albums, Videos, Announcements, plus categories,
notifications, dashboard, RBAC/audit logging, and configurable branding.
See [`docs/TESTING.md`](docs/TESTING.md) for verification status and
[`docs/STORE_RELEASE.md`](docs/STORE_RELEASE.md) for what's still needed
before Phases 7–8 (production infra, store submission).
