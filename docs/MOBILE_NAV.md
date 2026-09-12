# Mobile App Navigation

```
RootStack (NavigationContainer)
├── Splash
├── OnboardingLanguage (first launch only: choose English / Telugu)
└── MainTabs (Bottom Tab Navigator)
    ├── Home
    │     → ActivityDetail
    │     → EventDetail
    │     → NewsDetail
    │     → AlbumDetail → PhotoViewer (full-screen, swipeable)
    │     → AnnouncementDetail
    ├── Activities (list, filter by category/date)
    │     → ActivityDetail
    ├── Grievance (Praja Samvad — ప్రజలతో ముఖాముఖి)
    │     ├── [not logged in] Landing — intro + Login / Sign Up
    │     │     → CitizenLogin
    │     │     → CitizenRegister (auto-logs-in on success, no forced second login)
    │     └── [logged in] My Grievances — New / Pending / Completed / All
    │           → NewGrievance (heading → description → category → sub-category →
    │             priority → location → up to 5 photo attachments → submit)
    │             → GrievanceSuccess (shows the server-generated Grievance ID)
    │           → GrievanceDetail (progress tracker + public timeline)
    │                 → Verify resolution (Yes, close / No, reopen with reason)
    │                 → 1–5★ feedback + comment (once closed)
    ├── Gallery (Albums grid | Videos toggle)
    │     → AlbumDetail → PhotoViewer
    │     → VideoDetail (embedded YouTube or hosted player)
    └── More
          → Events (Upcoming / Today / Past segmented tabs)
          │     → EventDetail → "Open in Maps"
          → News (list → NewsDetail)
          → Announcements (list → AnnouncementDetail)
          → Search (global, filters: type/date/category/location)
          → Settings
                → Language (English/Telugu)
                → Notifications toggle
                → About / Privacy Policy / Terms
                → Contact / Information channels
```

Bottom tabs: **Home | Activities | Grievance | Gallery | More**. Events
moved from its own tab into More to make room for the Grievance tab — it's
still fully reachable, just one level deeper, and nothing about the Events
list/detail screens themselves changed.

The Grievance tab is a **single auth-gated screen**, not a separate stack:
logged-out citizens see a Praja Samvad intro with Login/Sign Up; logged-in
citizens see their own grievance list directly, in the same tab slot. Login
and Sign Up push onto the root stack (not a nested navigator) so they can
`navigation.goBack()` straight back into the tab once authenticated.

Each list screen (Activities, Events, News, Videos, **and My Grievances**)
uses the same shared `InfiniteContentList` component — `FlatList` +
infinite scroll + pull-to-refresh + skeleton loaders on first load + a
shared `EmptyState`/`ErrorState` (never a raw error or blank screen) — one
implementation, not six near-identical ones.

State/data layer: `@tanstack/react-query` for all API calls (cache,
retry-on-reconnect, background refetch), persisted to `AsyncStorage` via
`@tanstack/query-persist-client` for offline viewing of recently loaded
screens. `NetInfo` drives a global offline banner. Citizen auth is a
completely separate token domain from any admin auth — see
`ARCHITECTURE.md` §6 — persisted in `AsyncStorage` alongside the query
cache, with a shared axios interceptor that attaches the citizen bearer
token and retries once through `/citizen/auth/refresh` on a 401.
