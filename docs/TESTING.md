# Testing

## What exists today

**Backend** (`backend/src/tests`, Jest + Supertest + `mongodb-memory-server`
— no real database needed to run these):
- `auth.test.ts` — login success/failure, unauthenticated access rejected, `/me`
- `activities.test.ts` — the full RBAC matrix (editor can draft but not
  publish/delete; content_admin can do both; viewer blocked entirely),
  input validation, and public/draft visibility separation
- `home.test.ts` — the aggregate home endpoint returns every section
- `scheduler.test.ts` — scheduled content auto-publishes at `publishAt`,
  published content auto-archives at `expiresAt`, future-dated content is
  left untouched

Run: `cd backend && npm test` (14/14 passing as of this writing).

Because Activities uses the shared `createCrudController` factory
(`backend/src/common/crudFactory.ts`), the RBAC/validation/audit-logging
behavior verified for Activities applies identically to Events, News,
Albums, Videos and Announcements — the factory is the thing under test, not
six independent implementations.

**Mobile**: `useContentList.test.ts` covers the pagination-flattening logic
shared by every list screen. `npx tsc --noEmit`, `eslint`, and a full
`expo export --platform ios` bundle build all pass clean — that catches
the class of bug unit tests wouldn't (broken imports, incompatible RN APIs,
navigation type mismatches).

**Admin portal**: `npm run build` (TypeScript project build + Vite bundle)
and `npm run lint` both pass clean. No component tests yet — see gaps below.

## What's not yet covered (next steps)

- **Admin portal**: no React Testing Library component tests (login form,
  content forms, RBAC-gated UI) — the CRUD flow was verified manually
  end-to-end in a browser (create → publish → appears in public API) but
  isn't automated.
- **Mobile**: no component-level tests for screens (would use
  `@testing-library/react-native`, already a devDependency) and no E2E
  tests (Detox/Maestro) — running the app in a real simulator/device
  against a live backend is the recommended next verification step.
- **Integration**: no automated test currently exercises the full chain
  admin-portal → API → mobile-app-visible-content; this was verified
  manually once (see the "Architecture & scaffolding" build notes) and
  should be turned into a Playwright (admin) + Detox (mobile) suite.
- **Security testing**: no automated SAST/dependency-scan wired into CI yet
  (no CI pipeline exists — see §18 "Development Methodology," CI/CD is
  explicitly deferred to a later phase in the brief).
- **Device testing**: only verified in this session via `npx expo export`
  (bundle-level) — real-device testing across the phones/tablets listed in
  §33 of the brief still needs to happen once a build is available.
- **Load/performance testing**: not yet exercised against realistic data
  volumes (thousands of activities/photos) — indexes are in place
  (see docs/ERD.md) but haven't been benchmarked.
