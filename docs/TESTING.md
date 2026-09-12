# Testing

## What exists today

**Backend** (`backend/src/tests`, Jest + Supertest + `mongodb-memory-server`
— a real, ephemeral MongoDB per run, not a mock; no external database needed):
- `auth.test.ts` — staff login success/failure, unauthenticated access
  rejected, `/me`
- `activities.test.ts` — the full RBAC matrix (editor can draft but not
  publish/delete; content_admin can do both; viewer blocked entirely),
  input validation, and public/draft visibility separation
- `home.test.ts` — the aggregate home endpoint returns every section
- `scheduler.test.ts` — scheduled content auto-publishes at `publishAt`,
  published content auto-archives at `expiresAt`, future-dated content is
  left untouched
- `citizenAuth.test.ts` — registration (valid, duplicate username, duplicate
  mobile, invalid mobile format, mismatched/under-length password), login by
  username or mobile, invalid password rejected, and a citizen access token
  confirmed rejected on an admin-only route
- `grievances.test.ts` — grievance creation + validation (missing heading,
  invalid category, missing sub-category with no custom note,
  unauthenticated); grievance-ID sequencing (sequential increment, year
  rollover, and a **25-way concurrent `Promise.all`** uniqueness test);
  ownership/RBAC (a citizen gets a plain 404 on another citizen's grievance,
  a citizen token is rejected on admin routes, an editor can view but not
  assign/resolve); the full workflow (assign → in-progress → resolve →
  citizen-verify → closed → feedback, plus the reopen branch); priority
  change requiring a reason and recomputing the due date; reject requiring
  a reason; timeline visibility (an internal note never reaches the citizen
  timeline, a public update reaches both); and admin search by mobile
  number, partial mobile number, and heading text

Run: `cd backend && npm test` (6 suites / 40 tests passing as of this writing).

Because Activities uses the shared `createCrudController` factory
(`backend/src/common/crudFactory.ts`), the RBAC/validation/audit-logging
behavior verified for Activities applies identically to Events, News,
Albums, Videos and Announcements — the factory is the thing under test, not
six independent implementations.

**Mobile**: `useContentList.test.ts` covers the pagination-flattening logic
shared by every list screen. `npx tsc --noEmit`, `eslint`, and a full native
Android build (`expo prebuild` + `expo run:android`) all pass clean — that
catches the class of bug unit tests wouldn't (broken imports, incompatible
RN APIs, navigation type mismatches, missing native-module linking for
newly added dependencies like `expo-image-picker`). The full citizen flow
(sign up → my grievances → new grievance with a photo attachment → detail →
verify → feedback) was also verified manually on a real device against the
live backend, including images loading correctly through S3/MinIO.

**Admin portal**: `npm run build` (TypeScript project build + Vite bundle)
and `npm run lint` both pass clean. No component tests yet — see gaps below.
The grievance list/detail/settings pages and the search-by-mobile-number fix
were verified manually in a browser against the live backend.

## What's not yet covered (next steps)

- **Admin portal**: no React Testing Library component tests (login form,
  content forms, RBAC-gated UI) — the CRUD flow was verified manually
  end-to-end in a browser (create → publish → appears in public API) but
  isn't automated. This includes the grievance management UI.
- **Mobile**: no component-level tests for screens (would use
  `@testing-library/react-native`, already a devDependency) and no E2E
  tests (Detox/Maestro) — running the app in a real simulator/device
  against a live backend is the recommended next verification step.
- **Grievance analytics UI**: the dashboard aggregation endpoints
  (`/admin/grievances/dashboard`, `/analytics/category`, `/analytics/ward`,
  `/analytics/department`, `/analytics/trends`) are implemented and
  reachable, but no admin frontend charts consume them yet — nothing to
  test there until that UI exists.
- **Per-citizen push delivery**: the backend targets `citizen_<id>` FCM
  topics, but the mobile app doesn't yet send its device token to a
  subscription endpoint, so this can't be end-to-end tested yet — matches a
  pre-existing gap in the original broadcast-only push design.
- **Ward/area heat map, CSV/PDF exports, WhatsApp/SMS channels, an
  officer-facing app**: none of these exist yet (see `docs/ARCHITECTURE.md`
  §11 risks table), so there's nothing to test.
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
