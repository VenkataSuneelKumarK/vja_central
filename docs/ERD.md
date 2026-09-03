# Entity-Relationship Diagram

```
┌────────────────┐        ┌──────────────────────┐
│      User        (admin)│      AuditLog          │
├────────────────┤        ├──────────────────────┤
│ _id             │◀──────┤ actorId (→User)       │
│ name            │        │ action                │
│ email           │        │ entityType            │
│ passwordHash    │        │ entityId              │
│ role            │        │ before / after (JSON) │
│ isActive        │        │ ip                    │
│ createdAt       │        │ createdAt             │
│ updatedAt       │        └──────────────────────┘
└────────────────┘
        ▲  createdBy / updatedBy (on every content doc below)
        │
┌───────┴────────────────────────────────────────────────────────┐
│                                                                    │
│  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐  │
│  │    Activity      │   │     Event        │   │     News         │  │
│  ├────────────────┤   ├────────────────┤   ├────────────────┤  │
│  │ _id              │   │ _id              │   │ _id              │  │
│  │ title_en/te      │   │ title_en/te      │   │ title_en/te      │  │
│  │ description_en/te│   │ description_en/te│   │ summary_en/te    │  │
│  │ date, time        │   │ date              │   │ content_en/te    │  │
│  │ location_en/te    │   │ startTime,endTime │   │ coverImage       │  │
│  │ geo {lat,lng}     │   │ location_en/te    │   │ category (→Cat)  │  │
│  │ category (→Cat)   │   │ address_en/te     │   │ author            │  │
│  │ media[] (→Media)  │   │ geo {lat,lng}     │   │ sourceUrl         │  │
│  │ externalLinks[]   │   │ media[] (→Media)  │   │ status            │  │
│  │ peopleInvolved[]  │   │ status            │   │ publishAt         │  │
│  │ status             │   │ registrationInfo  │   │ expiresAt         │  │
│  │ publishAt          │   │ createdBy/By      │   │ createdBy/By      │  │
│  │ expiresAt          │   │ createdAt/Updated │   │ createdAt/Updated │  │
│  │ createdBy/By       │   └────────────────┘   └────────────────┘  │
│  │ createdAt/Updated  │                                              │
│  └────────────────┘                                              │
│                                                                    │
│  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐  │
│  │     Album         │   │     Photo         │   │     Video         │  │
│  ├────────────────┤   ├────────────────┤   ├────────────────┤  │
│  │ _id               │◀──┤ albumId (→Album) │   │ _id               │  │
│  │ title_en/te       │   │ imageUrl          │   │ title_en/te       │  │
│  │ description_en/te │   │ thumbnailUrl      │   │ description_en/te │  │
│  │ date, location_en/te│ │ mediumUrl         │   │ thumbnailUrl       │  │
│  │ coverImage         │   │ caption_en/te     │   │ videoUrl / ytId    │  │
│  │ status             │   │ sortOrder         │   │ category (→Cat)    │  │
│  │ createdBy/By       │   │ createdAt         │   │ status              │  │
│  │ createdAt/Updated  │   └────────────────┘   │ publishAt           │  │
│  └────────────────┘                            │ createdBy/By        │  │
│                                                    │ createdAt/Updated  │  │
│  ┌────────────────┐   ┌────────────────┐       └────────────────┘  │
│  │  Announcement     │   │    Category        │                          │
│  ├────────────────┤   ├────────────────┤   ┌────────────────┐      │
│  │ _id               │   │ _id               │   │  Notification      │      │
│  │ title_en/te       │   │ name_en/te        │   ├────────────────┤      │
│  │ content_en/te     │   │ slug              │   │ _id                │      │
│  │ priority           │   │ appliesTo[]       │   │ title_en/te        │      │
│  │ status             │   │ (activity/event/  │   │ body_en/te         │      │
│  │ publishAt/expiresAt│   │  news/video)      │   │ contentType         │      │
│  │ createdBy/By       │   │ isActive          │   │ contentId           │      │
│  │ createdAt/Updated  │   └────────────────┘   │ sentAt / status      │      │
│  └────────────────┘                            │ sentBy (→User)       │      │
│                                                    └────────────────┘      │
└────────────────────────────────────────────────────────────────────┘
```

## Notes

- **Bilingual fields**: every citizen-facing text field is stored as a pair
  (`_en`, `_te`) rather than a separate translation table — keeps reads to a
  single document fetch, which matters for a mobile home feed.
- **Media sub-documents**: `Activity.media[]` and `Event.media[]` embed
  `{ url, thumbnailUrl, type, caption_en, caption_te }` rather than
  referencing a separate collection — activities/events own a small, bounded
  number of media items, so embedding avoids a join. **Photos**, by
  contrast, get their own top-level collection because albums can hold
  hundreds of photos that need independent pagination, reordering, and
  deletion.
- **Indexes**:
  - `Activity`: `{ status: 1, publishAt: -1 }`, `{ category: 1, status: 1 }`, `{ date: -1 }`, text index on `title_en, title_te, description_en, description_te`
  - `Event`: `{ status: 1, date: 1 }`, `{ date: 1 }`
  - `News`: `{ status: 1, publishAt: -1 }`, `{ category: 1 }`, text index
  - `Photo`: `{ albumId: 1, sortOrder: 1 }`
  - `Announcement`: `{ status: 1, priority: 1, publishAt: -1 }`
  - `User`: unique index on `email`
- **Status enum** (Activity/Event/News/Album/Video/Announcement):
  `draft | scheduled | published | archived`.
- **Role enum** (User): `super_admin | content_admin | editor | viewer`.
