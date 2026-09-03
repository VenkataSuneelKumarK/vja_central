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
    ├── Events (Upcoming / Today / Past segmented tabs)
    │     → EventDetail → "Open in Maps"
    ├── Gallery (Albums grid | Videos toggle)
    │     → AlbumDetail → PhotoViewer
    │     → VideoDetail (embedded YouTube or hosted player)
    └── More
          → News (list → NewsDetail)
          → Announcements (list → AnnouncementDetail)
          → Search (global, filters: type/date/category/location)
          → Settings
                → Language (English/Telugu)
                → Notifications toggle
                → About / Privacy Policy / Terms
                → Contact / Information channels
```

Bottom tabs: **Home | Activities | Events | Gallery | More** (per §41 of
the brief). Each list screen uses `FlatList` + infinite scroll +
pull-to-refresh + skeleton loaders on first load + a shared `EmptyState`
and `ErrorState` component (never a raw error or blank screen).

State/data layer: `@tanstack/react-query` for all API calls (cache,
retry-on-reconnect, background refetch), persisted to `AsyncStorage` via
`@tanstack/query-persist-client` for offline viewing of recently loaded
screens. `NetInfo` drives a global offline banner.
