# VJA Central — MongoDB Database Schema

This document is the executable database schema for the **Mana Vijayawada / VJA Central** platform (content modules + the Praja Samvad grievance module), generated directly from the live Mongoose models in `backend/src/models/`. It is meant to be copy-pasted and run against a **new, empty MongoDB instance on another system** to recreate the same collections, field validation, and indexes — without needing to boot the Node app first.

MongoDB itself is schema-less; "schema" here means two things MongoDB *does* enforce when you ask it to:

1. **Collection validators** (`$jsonSchema`) — field names, types, required fields, and enums.
2. **Indexes** — including `unique` constraints (e.g. one document per email/username/mobile) and text-search indexes.

There are no foreign-key constraints in MongoDB — relationships (`category`, `citizenId`, `department`, etc.) are plain `ObjectId` references resolved by the application via `.populate()`, not by the database.

## How to execute this

```bash
# 1. Point at your target database (creates it if it doesn't exist)
mongosh "mongodb://<host>:<port>/<database-name>"

# 2. Then paste the script in "§0 — Full executable script" below directly
#    into that shell, OR save it to a file and run it non-interactively:
mongosh "mongodb://<host>:<port>/<database-name>" vja_central_schema.js
```

Requires MongoDB **4.4+** (this schema uses `$jsonSchema` validators, supported since 3.6, and is tested against the same `mongo:7` image the project's own `docker-compose.yml` uses).

> **Validation mode:** every collection below is created with `validationLevel: "moderate"` and `validationAction: "warn"` — new/modified documents are checked and a warning is logged on mismatch, but nothing is *blocked*. This is deliberately permissive so an initial data import (e.g. restoring a dump from the original system) can't be rejected by a subtle schema mismatch. Once you've confirmed real data conforms, flip a collection to strict enforcement with:
> ```javascript
> db.runCommand({ collMod: "<collection>", validationLevel: "strict", validationAction: "error" });
> ```

## Collection map

| # | Collection | Mongoose model | Domain |
|---|---|---|---|
| 1 | `users` | `User` | Admin/staff |
| 2 | `auditlogs` | `AuditLog` | Admin/staff |
| 3 | `categories` | `Category` | Content |
| 4 | `activities` | `Activity` | Content |
| 5 | `events` | `Event` | Content |
| 6 | `news` | `News` | Content |
| 7 | `albums` | `Album` | Content |
| 8 | `photos` | `Photo` | Content |
| 9 | `videos` | `Video` | Content |
| 10 | `announcements` | `Announcement` | Content |
| 11 | `notifications` | `Notification` | Content |
| 12 | `appsettings` | `AppSettings` | Content (singleton) |
| 13 | `citizens` | `Citizen` | Grievance (Praja Samvad) |
| 14 | `counters` | `Counter` | Grievance (Praja Samvad) |
| 15 | `departments` | `Department` | Grievance (Praja Samvad) |
| 16 | `officers` | `Officer` | Grievance (Praja Samvad) |
| 17 | `grievancecategories` | `GrievanceCategory` | Grievance (Praja Samvad) |
| 18 | `grievanceslaconfigs` | `GrievanceSlaConfig` | Grievance (Praja Samvad, singleton) |
| 19 | `grievances` | `Grievance` | Grievance (Praja Samvad) |
| 20 | `grievanceactivities` | `GrievanceActivity` | Grievance (Praja Samvad) |

---

## §0 — Full executable script

Save everything in this one fenced block as `vja_central_schema.js` and run it with `mongosh <connection-string> vja_central_schema.js`. It is idempotent-safe to re-run: `createCollection` calls are wrapped so an existing collection is skipped (with a console notice) rather than erroring, and `createIndex` calls are naturally idempotent in MongoDB.

```javascript
function ensureCollection(name, options) {
  if (db.getCollectionNames().includes(name)) {
    print(`- ${name}: already exists, skipping createCollection (indexes below still apply)`);
    return;
  }
  db.createCollection(name, options);
  print(`- ${name}: created`);
}

const bilingual = (required = true) => ({
  bsonType: "object",
  ...(required ? { required: ["en"] } : {}),
  properties: { en: { bsonType: "string" }, te: { bsonType: "string" } },
});

const geo = {
  bsonType: "object",
  properties: { lat: { bsonType: ["double", "int", "null"] }, lng: { bsonType: ["double", "int", "null"] } },
};

const mediaItem = {
  bsonType: "object",
  required: ["url"],
  properties: {
    url: { bsonType: "string" },
    thumbnailUrl: { bsonType: "string" },
    mediumUrl: { bsonType: "string" },
    type: { bsonType: "string", enum: ["image", "video"] },
    caption_en: { bsonType: "string" },
    caption_te: { bsonType: "string" },
  },
};

const attachment = {
  bsonType: "object",
  required: ["url", "fileName", "fileType"],
  properties: {
    url: { bsonType: "string" },
    thumbnailUrl: { bsonType: "string" },
    mediumUrl: { bsonType: "string" },
    fileName: { bsonType: "string" },
    fileType: { bsonType: "string" },
    uploadedAt: { bsonType: "date" },
  },
};

const CONTENT_STATUSES = ["draft", "scheduled", "published", "archived"];
const ROLES = ["super_admin", "content_admin", "editor", "viewer"];
const CONTENT_TYPES = ["activity", "event", "news", "album", "video", "announcement"];
const ANNOUNCEMENT_PRIORITIES = ["normal", "important", "urgent"];
const GRIEVANCE_STATUSES = ["open", "assigned", "in_progress", "resolved", "verified", "reopened", "closed", "rejected"];
const GRIEVANCE_PRIORITIES = ["emergency", "high", "normal", "suggestion"];

const VALIDATION = { validationLevel: "moderate", validationAction: "warn" };

// ---------- 1. users (admin/staff) ----------
ensureCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "passwordHash"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        passwordHash: { bsonType: "string" },
        role: { bsonType: "string", enum: ROLES },
        isActive: { bsonType: "bool" },
      },
    },
  },
  ...VALIDATION,
});
db.users.createIndex({ email: 1 }, { unique: true });

// ---------- 2. auditlogs ----------
ensureCollection("auditlogs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["actorId", "actorEmail", "action", "entityType"],
      properties: {
        actorId: { bsonType: "objectId" },
        actorEmail: { bsonType: "string" },
        action: { bsonType: "string" },
        entityType: { bsonType: "string" },
        // entityId is Mixed (ObjectId for most entities, a fixed string id for
        // singletons like "app_settings" / "grievance_sla_config") — left
        // untyped deliberately.
        ip: { bsonType: "string" },
      },
    },
  },
  ...VALIDATION,
});
db.auditlogs.createIndex({ actorId: 1 });
db.auditlogs.createIndex({ entityType: 1 });
db.auditlogs.createIndex({ createdAt: -1 });

// ---------- 3. categories (content categories) ----------
ensureCollection("categories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug"],
      properties: {
        name: bilingual(),
        slug: { bsonType: "string" },
        appliesTo: { bsonType: "array", items: { bsonType: "string", enum: CONTENT_TYPES } },
        isActive: { bsonType: "bool" },
      },
    },
  },
  ...VALIDATION,
});
db.categories.createIndex({ slug: 1 }, { unique: true });

// ---------- 4. activities ----------
ensureCollection("activities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "description", "date", "location", "status"],
      properties: {
        title: bilingual(),
        description: bilingual(),
        date: { bsonType: "date" },
        time: { bsonType: "string" },
        location: bilingual(),
        geo: geo,
        category: { bsonType: ["objectId", "null"] },
        coverImage: { bsonType: "string" },
        media: { bsonType: "array", items: mediaItem },
        externalLinks: { bsonType: "array", items: { bsonType: "string" } },
        peopleInvolved: { bsonType: "array", items: { bsonType: "string" } },
        status: { bsonType: "string", enum: CONTENT_STATUSES },
        publishAt: { bsonType: ["date", "null"] },
        expiresAt: { bsonType: ["date", "null"] },
        createdBy: { bsonType: "objectId" },
        updatedBy: { bsonType: "objectId" },
      },
    },
  },
  ...VALIDATION,
});
db.activities.createIndex({ status: 1, publishAt: -1 });
db.activities.createIndex({ status: 1, date: -1 });
db.activities.createIndex({ date: 1 });
db.activities.createIndex({ category: 1 });
db.activities.createIndex(
  { "title.en": "text", "title.te": "text", "description.en": "text", "description.te": "text" },
  { name: "activity_text_search" }
);

// ---------- 5. events ----------
ensureCollection("events", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "description", "date", "location", "status"],
      properties: {
        title: bilingual(),
        description: bilingual(),
        date: { bsonType: "date" },
        startTime: { bsonType: "string" },
        endTime: { bsonType: "string" },
        location: bilingual(),
        address: bilingual(false),
        geo: geo,
        media: { bsonType: "array", items: mediaItem },
        registrationInfo: { bsonType: "object" },
        status: { bsonType: "string", enum: CONTENT_STATUSES },
        publishAt: { bsonType: ["date", "null"] },
        expiresAt: { bsonType: ["date", "null"] },
        createdBy: { bsonType: "objectId" },
        updatedBy: { bsonType: "objectId" },
      },
    },
  },
  ...VALIDATION,
});
db.events.createIndex({ status: 1, date: 1 });
db.events.createIndex(
  { "title.en": "text", "title.te": "text", "description.en": "text", "description.te": "text" },
  { name: "event_text_search" }
);

// ---------- 6. news ----------
ensureCollection("news", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "summary", "content", "status"],
      properties: {
        title: bilingual(),
        summary: bilingual(),
        content: bilingual(),
        coverImage: { bsonType: "string" },
        category: { bsonType: ["objectId", "null"] },
        author: { bsonType: "string" },
        sourceUrl: { bsonType: "string" },
        status: { bsonType: "string", enum: CONTENT_STATUSES },
        publishAt: { bsonType: ["date", "null"] },
        expiresAt: { bsonType: ["date", "null"] },
        createdBy: { bsonType: "objectId" },
        updatedBy: { bsonType: "objectId" },
      },
    },
  },
  ...VALIDATION,
});
db.news.createIndex({ status: 1, publishAt: -1 });
db.news.createIndex({ category: 1 });
db.news.createIndex({ "title.en": "text", "title.te": "text", "summary.en": "text", "content.en": "text" }, { name: "news_text_search" });

// ---------- 7. albums ----------
ensureCollection("albums", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "status"],
      properties: {
        title: bilingual(),
        description: bilingual(false),
        date: { bsonType: "date" },
        location: bilingual(false),
        coverImage: { bsonType: "string" },
        status: { bsonType: "string", enum: CONTENT_STATUSES },
        publishAt: { bsonType: ["date", "null"] },
        expiresAt: { bsonType: ["date", "null"] },
        createdBy: { bsonType: "objectId" },
        updatedBy: { bsonType: "objectId" },
      },
    },
  },
  ...VALIDATION,
});
db.albums.createIndex({ status: 1, publishAt: -1 });
db.albums.createIndex({ "title.en": "text", "title.te": "text", "description.en": "text" }, { name: "album_text_search" });

// ---------- 8. photos ----------
ensureCollection("photos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["albumId", "imageUrl", "thumbnailUrl", "mediumUrl"],
      properties: {
        albumId: { bsonType: "objectId" },
        imageUrl: { bsonType: "string" },
        thumbnailUrl: { bsonType: "string" },
        mediumUrl: { bsonType: "string" },
        caption: { bsonType: "object", properties: { en: { bsonType: "string" }, te: { bsonType: "string" } } },
        sortOrder: { bsonType: ["int", "double"] },
      },
    },
  },
  ...VALIDATION,
});
db.photos.createIndex({ albumId: 1, sortOrder: 1 });

// ---------- 9. videos ----------
ensureCollection("videos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "source", "status"],
      properties: {
        title: bilingual(),
        description: bilingual(false),
        thumbnailUrl: { bsonType: "string" },
        source: { bsonType: "string", enum: ["youtube", "hosted"] },
        videoUrl: { bsonType: "string" },
        youtubeId: { bsonType: "string" },
        category: { bsonType: ["objectId", "null"] },
        status: { bsonType: "string", enum: CONTENT_STATUSES },
        publishAt: { bsonType: ["date", "null"] },
        expiresAt: { bsonType: ["date", "null"] },
        createdBy: { bsonType: "objectId" },
        updatedBy: { bsonType: "objectId" },
      },
    },
  },
  ...VALIDATION,
});
db.videos.createIndex({ status: 1, publishAt: -1 });
db.videos.createIndex({ category: 1 });
db.videos.createIndex({ "title.en": "text", "title.te": "text", "description.en": "text" }, { name: "video_text_search" });

// ---------- 10. announcements ----------
ensureCollection("announcements", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "content", "status"],
      properties: {
        title: bilingual(),
        content: bilingual(),
        priority: { bsonType: "string", enum: ANNOUNCEMENT_PRIORITIES },
        status: { bsonType: "string", enum: CONTENT_STATUSES },
        publishAt: { bsonType: ["date", "null"] },
        expiresAt: { bsonType: ["date", "null"] },
        createdBy: { bsonType: "objectId" },
        updatedBy: { bsonType: "objectId" },
      },
    },
  },
  ...VALIDATION,
});
db.announcements.createIndex({ status: 1, priority: 1, publishAt: -1 });
db.announcements.createIndex({ "title.en": "text", "title.te": "text", "content.en": "text" }, { name: "announcement_text_search" });

// ---------- 11. notifications (send history) ----------
ensureCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "body", "sentBy"],
      properties: {
        title: bilingual(),
        body: bilingual(),
        contentType: { bsonType: "string", enum: [...CONTENT_TYPES, "general"] },
        contentId: { bsonType: "objectId" },
        status: { bsonType: "string", enum: ["sent", "failed"] },
        successCount: { bsonType: ["int", "double"] },
        failureCount: { bsonType: ["int", "double"] },
        sentBy: { bsonType: "objectId" },
        sentAt: { bsonType: "date" },
      },
    },
  },
  ...VALIDATION,
});
db.notifications.createIndex({ sentAt: -1 });

// ---------- 12. appsettings (singleton, _id: "app_settings") ----------
ensureCollection("appsettings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id"],
      properties: {
        _id: { bsonType: "string" },
        logoUrl: { bsonType: "string" },
        profileImageUrl: { bsonType: "string" },
        splashImageUrl: { bsonType: "string" },
        primaryColor: { bsonType: "string" },
        secondaryColor: { bsonType: "string" },
        dashboardStyle: { bsonType: "string", enum: ["classic", "accent"] },
        contactPhone: { bsonType: "string" },
        contactEmail: { bsonType: "string" },
        contactAddress: { bsonType: "string" },
        socialLinks: { bsonType: "object" },
        privacyPolicyUrl: { bsonType: "string" },
        termsUrl: { bsonType: "string" },
      },
    },
  },
  ...VALIDATION,
});
// Seed the singleton document if it doesn't exist yet (matches the app's own defaults).
db.appsettings.updateOne(
  { _id: "app_settings" },
  { $setOnInsert: { primaryColor: "#2563EB", secondaryColor: "#1E3A8A", dashboardStyle: "classic" } },
  { upsert: true }
);

// ================= Praja Samvad / Grievance module =================

// ---------- 13. citizens ----------
ensureCollection("citizens", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "mobile", "passwordHash"],
      properties: {
        username: { bsonType: "string" },
        mobile: { bsonType: "string" },
        fullName: { bsonType: "string" },
        passwordHash: { bsonType: "string" },
        isActive: { bsonType: "bool" },
        pushTopicSubscribed: { bsonType: "bool" },
      },
    },
  },
  ...VALIDATION,
});
db.citizens.createIndex({ username: 1 }, { unique: true });
db.citizens.createIndex({ mobile: 1 }, { unique: true });

// ---------- 14. counters (atomic sequence generator) ----------
ensureCollection("counters", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id"],
      properties: { _id: { bsonType: "string" }, seq: { bsonType: ["int", "double"] } },
    },
  },
  ...VALIDATION,
});

// ---------- 15. departments ----------
ensureCollection("departments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: { name: bilingual(), isActive: { bsonType: "bool" } },
    },
  },
  ...VALIDATION,
});

// ---------- 16. officers ----------
ensureCollection("officers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "department"],
      properties: {
        name: { bsonType: "string" },
        mobile: { bsonType: "string" },
        department: { bsonType: "objectId" },
        isActive: { bsonType: "bool" },
      },
    },
  },
  ...VALIDATION,
});
db.officers.createIndex({ department: 1 });

// ---------- 17. grievancecategories ----------
ensureCollection("grievancecategories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug"],
      properties: {
        name: bilingual(),
        slug: { bsonType: "string" },
        isOther: { bsonType: "bool" },
        subCategories: {
          bsonType: "array",
          items: { bsonType: "object", required: ["name", "slug"], properties: { name: bilingual(), slug: { bsonType: "string" } } },
        },
        isActive: { bsonType: "bool" },
        sortOrder: { bsonType: ["int", "double"] },
      },
    },
  },
  ...VALIDATION,
});
db.grievancecategories.createIndex({ slug: 1 }, { unique: true });

// ---------- 18. grievanceslaconfigs (singleton, _id: "grievance_sla_config") ----------
ensureCollection("grievanceslaconfigs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id"],
      properties: {
        _id: { bsonType: "string" },
        emergencyHours: { bsonType: ["int", "double"] },
        highHours: { bsonType: ["int", "double"] },
        normalHours: { bsonType: ["int", "double"] },
        suggestionHours: { bsonType: ["int", "double"] },
      },
    },
  },
  ...VALIDATION,
});
// Seed the singleton document with the app's own defaults (24h / 72h / 168h / 336h).
db.grievanceslaconfigs.updateOne(
  { _id: "grievance_sla_config" },
  { $setOnInsert: { emergencyHours: 24, highHours: 72, normalHours: 168, suggestionHours: 336 } },
  { upsert: true }
);

// ---------- 19. grievances ----------
ensureCollection("grievances", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "grievanceNumber", "year", "sequenceNumber", "citizenId", "citizenName", "citizenMobile",
        "heading", "description", "category", "initialPriority", "priority", "createdBy",
      ],
      properties: {
        grievanceNumber: { bsonType: "string", description: "Format MV-YYYY-NNNNNN, server-generated only" },
        year: { bsonType: ["int", "double"] },
        sequenceNumber: { bsonType: ["int", "double"] },
        citizenId: { bsonType: "objectId" },
        citizenName: { bsonType: "string" },
        citizenMobile: { bsonType: "string" },
        heading: { bsonType: "string" },
        description: { bsonType: "string" },
        category: { bsonType: "objectId" },
        subCategory: { bsonType: "string" },
        customCategoryNote: { bsonType: "string" },
        initialPriority: { bsonType: "string", enum: GRIEVANCE_PRIORITIES },
        priority: { bsonType: "string", enum: GRIEVANCE_PRIORITIES },
        priorityChangeReason: { bsonType: "string" },
        status: { bsonType: "string", enum: GRIEVANCE_STATUSES },
        area: { bsonType: "string" },
        ward: { bsonType: "string" },
        landmark: { bsonType: "string" },
        geo: geo,
        attachments: { bsonType: "array", items: attachment },
        department: { bsonType: ["objectId", "null"] },
        assignedOfficer: { bsonType: ["objectId", "null"] },
        assignedOfficerName: { bsonType: "string" },
        assignedBy: { bsonType: ["objectId", "null"] },
        assignedAt: { bsonType: ["date", "null"] },
        dueDate: { bsonType: ["date", "null"] },
        dueDateOverridden: { bsonType: "bool" },
        resolutionDescription: { bsonType: "string" },
        resolutionAttachments: { bsonType: "array", items: attachment },
        citizenFeedback: { bsonType: "string" },
        citizenRating: { bsonType: ["int", "double"], minimum: 1, maximum: 5 },
        rejectionReason: { bsonType: "string" },
        reopenReason: { bsonType: "string" },
        reopenCount: { bsonType: ["int", "double"] },
        createdBy: { bsonType: "objectId" },
        updatedBy: { bsonType: ["objectId", "null"] },
        resolvedAt: { bsonType: ["date", "null"] },
        verifiedAt: { bsonType: ["date", "null"] },
        closedAt: { bsonType: ["date", "null"] },
      },
    },
  },
  ...VALIDATION,
});
db.grievances.createIndex({ grievanceNumber: 1 }, { unique: true });
db.grievances.createIndex({ year: 1 });
db.grievances.createIndex({ status: 1, createdAt: -1 });
db.grievances.createIndex({ priority: 1, status: 1 });
db.grievances.createIndex({ citizenId: 1, status: 1 });
db.grievances.createIndex({ createdAt: -1 });
db.grievances.createIndex({ category: 1 });
db.grievances.createIndex({ ward: 1 });
db.grievances.createIndex({ department: 1 });
db.grievances.createIndex({ assignedOfficer: 1 });
db.grievances.createIndex({ dueDate: 1 });
db.grievances.createIndex(
  { heading: "text", description: "text", citizenName: "text", grievanceNumber: "text" },
  { name: "grievance_text_search" }
);

// ---------- 20. grievanceactivities (append-only timeline) ----------
ensureCollection("grievanceactivities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["grievanceId", "action", "actorType", "actorName", "message"],
      properties: {
        grievanceId: { bsonType: "objectId" },
        action: { bsonType: "string" },
        actorType: { bsonType: "string", enum: ["citizen", "admin", "system"] },
        actorId: { bsonType: ["objectId", "null"] },
        actorName: { bsonType: "string" },
        message: { bsonType: "string" },
        isPublic: { bsonType: "bool" },
        // metadata is Schema.Types.Mixed — deliberately untyped.
      },
    },
  },
  ...VALIDATION,
});
db.grievanceactivities.createIndex({ grievanceId: 1, createdAt: 1 });

print("\nVJA Central schema created/verified — 20 collections, all indexes applied.");
```

---

## Per-collection reference

Field tables below are the human-readable counterpart to §0 — use them to sanity-check the script or to hand-build the schema in a tool other than `mongosh`. `req.` = required, default shown where the model declares one.

### 1. `users` — staff/admin accounts

| Field | Type | Notes |
|---|---|---|
| `name` | string, req. | |
| `email` | string, req., **unique** | lowercased, trimmed |
| `passwordHash` | string, req. | bcrypt, cost 12 — never returned by the API |
| `role` | enum, default `viewer` | `super_admin \| content_admin \| editor \| viewer` |
| `isActive` | bool, default `true` | |
| `createdAt` / `updatedAt` | date | automatic timestamps |

### 2. `auditlogs` — immutable admin action trail

| Field | Type | Notes |
|---|---|---|
| `actorId` | ObjectId → `users`, req. | indexed |
| `actorEmail` | string, req. | |
| `action` | string, req. | e.g. `create`, `update`, `delete`, `publish`, `status_change`, `assign`, `resolve`, `reject` |
| `entityType` | string, req. | indexed — e.g. `activity`, `grievance`, `department` |
| `entityId` | ObjectId or string | Mixed — singletons (`app_settings`) use a fixed string id |
| `before` / `after` | mixed | untyped snapshot for diffing |
| `ip` | string | |
| `createdAt` | date | indexed `-1`; no `updatedAt` (append-only) |

### 3. `categories` — content categories

| Field | Type | Notes |
|---|---|---|
| `name` | `{ en: string (req.), te: string }` | |
| `slug` | string, req., **unique** | lowercased |
| `appliesTo` | string[] | subset of `activity \| event \| news \| album \| video \| announcement` |
| `isActive` | bool, default `true` | |

### 4. `activities`

| Field | Type | Notes |
|---|---|---|
| `title`, `description`, `location` | bilingual `{en,te}`, req. | |
| `date` | date, req. | indexed |
| `time` | string | free text, e.g. "10:30 AM" |
| `geo` | `{ lat, lng }` | nullable |
| `category` | ObjectId → `categories`, nullable | indexed |
| `coverImage` | string (URL) | |
| `media[]` | `{ url, thumbnailUrl?, mediumUrl?, type: image\|video, caption_en, caption_te }` | |
| `externalLinks[]`, `peopleInvolved[]` | string[] | |
| `status` | enum, default `draft` | `draft \| scheduled \| published \| archived` — indexed |
| `publishAt`, `expiresAt` | date, nullable | `publishAt` indexed |
| `createdBy` | ObjectId → `users`, req. | |
| `updatedBy` | ObjectId → `users` | |

Indexes: `{status,publishAt}`, `{status,date}`, `{date}`, `{category}`, text index on title/description (en+te).

### 5. `events`

Same shape as `activities` minus `category`/`coverImage`/`externalLinks`/`peopleInvolved`, plus:

| Field | Type | Notes |
|---|---|---|
| `startTime`, `endTime` | string | |
| `address` | bilingual, optional | |
| `registrationInfo` | bilingual, optional | |

Indexes: `{status,date}`, text index on title/description.

### 6. `news`

| Field | Type | Notes |
|---|---|---|
| `title`, `summary`, `content` | bilingual, req. | |
| `coverImage` | string | |
| `category` | ObjectId → `categories`, nullable | indexed |
| `author`, `sourceUrl` | string | |
| `status`, `publishAt`, `expiresAt`, `createdBy`, `updatedBy` | — | same as `activities` |

Indexes: `{status,publishAt}`, `{category}`, text index on title/summary/content.

### 7. `albums`

| Field | Type | Notes |
|---|---|---|
| `title` | bilingual, req. | |
| `description`, `location` | bilingual, optional | |
| `date` | date, optional | |
| `coverImage` | string | |
| `status`, `publishAt`, `expiresAt`, `createdBy`, `updatedBy` | — | same as `activities` |

Indexes: `{status,publishAt}`, text index on title/description.

### 8. `photos` — child of `albums`

| Field | Type | Notes |
|---|---|---|
| `albumId` | ObjectId → `albums`, req. | indexed |
| `imageUrl`, `thumbnailUrl`, `mediumUrl` | string, req. | |
| `caption` | `{en,te}`, optional | |
| `sortOrder` | number, default `0` | |
| `createdAt` | date | no `updatedAt` |

Index: `{albumId, sortOrder}`.

### 9. `videos`

| Field | Type | Notes |
|---|---|---|
| `title` | bilingual, req. | |
| `description` | bilingual, optional | |
| `thumbnailUrl` | string | |
| `source` | enum, req. | `youtube \| hosted` |
| `videoUrl`, `youtubeId` | string | one or the other, depending on `source` |
| `category` | ObjectId → `categories`, nullable | indexed |
| `status`, `publishAt`, `expiresAt`, `createdBy`, `updatedBy` | — | same as `activities` |

Indexes: `{status,publishAt}`, `{category}`, text index on title/description.

### 10. `announcements`

| Field | Type | Notes |
|---|---|---|
| `title`, `content` | bilingual, req. | |
| `priority` | enum, default `normal` | `normal \| important \| urgent` |
| `status`, `publishAt`, `expiresAt`, `createdBy`, `updatedBy` | — | same as `activities` |

Index: `{status,priority,publishAt}`, text index on title/content.

### 11. `notifications` — push send history

| Field | Type | Notes |
|---|---|---|
| `title`, `body` | bilingual, req. | |
| `contentType` | enum | content type or `general` |
| `contentId` | ObjectId, optional | the content item the push linked to |
| `status` | enum, default `sent` | `sent \| failed` |
| `successCount`, `failureCount` | number, default `0` | |
| `sentBy` | ObjectId → `users`, req. | |
| `sentAt` | date, default now | indexed |

### 12. `appsettings` — singleton (`_id: "app_settings"`)

| Field | Type | Notes |
|---|---|---|
| `logoUrl`, `profileImageUrl`, `splashImageUrl` | string | |
| `primaryColor` | string, default `#2563EB` | |
| `secondaryColor` | string, default `#1E3A8A` | |
| `dashboardStyle` | enum, default `classic` | `classic \| accent` — admin-portal-only preference |
| `contactPhone`, `contactEmail`, `contactAddress` | string | |
| `socialLinks` | `{facebook?, twitter?, instagram?, youtube?}` | |
| `privacyPolicyUrl`, `termsUrl` | string | |
| `updatedAt` | date | no `createdAt` |

### 13. `citizens` — Praja Samvad citizen accounts (separate from `users`)

| Field | Type | Notes |
|---|---|---|
| `username` | string, req., **unique** | lowercased |
| `mobile` | string, req., **unique** | 10-digit Indian mobile |
| `fullName` | string, optional | |
| `passwordHash` | string, req. | bcrypt, cost 12 |
| `isActive` | bool, default `true` | |
| `pushTopicSubscribed` | bool, default `false` | informational; actual FCM subscription lives client-side |

> Deliberately a separate collection from `users` — a citizen token and a staff token must never be able to authenticate as each other (see `docs/ARCHITECTURE.md` §5).

### 14. `counters` — atomic sequence generator

| Field | Type | Notes |
|---|---|---|
| `_id` | string | namespaced key, e.g. `grievance_2026` |
| `seq` | number, default `0` | incremented atomically via `findOneAndUpdate` + `$inc` |

### 15. `departments`

| Field | Type | Notes |
|---|---|---|
| `name` | bilingual, req. | |
| `isActive` | bool, default `true` | |

### 16. `officers`

| Field | Type | Notes |
|---|---|---|
| `name` | string, req. | |
| `mobile` | string, optional | |
| `department` | ObjectId → `departments`, req. | indexed |
| `isActive` | bool, default `true` | |

### 17. `grievancecategories` — two-level grievance taxonomy

| Field | Type | Notes |
|---|---|---|
| `name` | bilingual, req. | |
| `slug` | string, req., **unique** | |
| `isOther` | bool, default `false` | if true, citizen supplies `customCategoryNote` instead of a fixed sub-category |
| `subCategories[]` | `{ name: {en,te}, slug }` | embedded, no separate collection |
| `isActive` | bool, default `true` | |
| `sortOrder` | number, default `0` | |

### 18. `grievanceslaconfigs` — singleton (`_id: "grievance_sla_config"`)

| Field | Type | Default |
|---|---|---|
| `emergencyHours` | number | `24` |
| `highHours` | number | `72` (3 days) |
| `normalHours` | number | `168` (7 days) |
| `suggestionHours` | number | `336` (14 days) |

`dueDate` on a grievance = `createdAt + <hours for its priority>`, computed at submission time — see `common/sla.ts`.

### 19. `grievances` — the core case record

| Field | Type | Notes |
|---|---|---|
| `grievanceNumber` | string, req., **unique** | format `MV-YYYY-NNNNNN`, server-generated only |
| `year`, `sequenceNumber` | number, req. | |
| `citizenId` | ObjectId → `citizens`, req. | indexed |
| `citizenName`, `citizenMobile` | string, req. | point-in-time snapshot, not re-read from `citizens` |
| `heading`, `description` | string, req. | |
| `category` | ObjectId → `grievancecategories`, req. | indexed |
| `subCategory` | string, optional | slug within the category's `subCategories[]` |
| `customCategoryNote` | string, optional | used instead of `subCategory` when `category.isOther` |
| `initialPriority` | enum, req. | as submitted by the citizen — **never mutated after creation** |
| `priority` | enum, req. | current/effective priority — staff may override |
| `priorityChangeReason` | string, optional | required by the API whenever `priority` is changed |
| `status` | enum, default `open` | `open \| assigned \| in_progress \| resolved \| verified \| reopened \| closed \| rejected` — indexed |
| `area`, `ward`, `landmark` | string, optional | `ward` indexed |
| `geo` | `{lat,lng}`, nullable | |
| `attachments[]` | `{url, thumbnailUrl?, mediumUrl?, fileName, fileType, uploadedAt}` | citizen-submitted photos |
| `department` | ObjectId → `departments`, nullable | indexed |
| `assignedOfficer` | ObjectId → `officers`, nullable | indexed |
| `assignedOfficerName` | string, optional | snapshot |
| `assignedBy` | ObjectId → `users`, nullable | |
| `assignedAt` | date, nullable | |
| `dueDate` | date, nullable | indexed; computed from priority + SLA config unless overridden |
| `dueDateOverridden` | bool, default `false` | |
| `resolutionDescription` | string, optional | required by the API when resolving |
| `resolutionAttachments[]` | same shape as `attachments[]` | before/after photos |
| `citizenFeedback` | string, optional | |
| `citizenRating` | number 1–5, optional | |
| `rejectionReason` | string, optional | required by the API when rejecting |
| `reopenReason` | string, optional | required when citizen disputes a resolution |
| `reopenCount` | number, default `0` | |
| `createdBy` | ObjectId → `citizens`, req. | duplicates `citizenId` to match the spec's literal field list |
| `updatedBy` | ObjectId → `users`, nullable | last staff member to modify |
| `resolvedAt`, `verifiedAt`, `closedAt` | date, nullable | |

Indexes: unique on `grievanceNumber`; `{year}`; `{status,createdAt}`; `{priority,status}`; `{citizenId,status}`; `{createdAt}`; `{category}`; `{ward}`; `{department}`; `{assignedOfficer}`; `{dueDate}`; text index on heading/description/citizenName/grievanceNumber.

### 20. `grievanceactivities` — append-only timeline (never updated or deleted)

| Field | Type | Notes |
|---|---|---|
| `grievanceId` | ObjectId → `grievances`, req. | indexed |
| `action` | string, req. | e.g. `submitted`, `assigned`, `status_changed`, `resolved`, `rejected`, `verified`, `reopened`, `closed`, `comment`, `feedback` |
| `actorType` | enum, req. | `citizen \| admin \| system` |
| `actorId` | ObjectId, nullable | null for `system`-generated entries |
| `actorName` | string, req. | |
| `message` | string, req. | human-readable, shown verbatim in the UI |
| `isPublic` | bool, default `true` | `false` = internal staff note, hidden from the citizen |
| `metadata` | mixed, optional | e.g. `{from, to, reason}` on a priority/status change |
| `createdAt` | date | indexed with `grievanceId`; **no `updatedAt`** — entries are never edited |

Index: `{grievanceId, createdAt}`.

---

## Relationships at a glance

```
users ──┬─< auditlogs (actorId)
        ├─< activities / events / news / albums / videos / announcements (createdBy, updatedBy)
        ├─< notifications (sentBy)
        └─< grievances (assignedBy, updatedBy)

categories ─< activities / news / videos (category)

citizens ──< grievances (citizenId, createdBy)
grievancecategories ─< grievances (category)
departments ──┬─< officers (department)
              └─< grievances (department)
officers ──< grievances (assignedOfficer)
grievances ──< grievanceactivities (grievanceId)
albums ──< photos (albumId)
```

No collection enforces these as hard foreign keys — MongoDB doesn't support that natively, and the application layer (Mongoose `.populate()`, plus server-side ownership checks on every citizen-facing route) is the actual source of referential integrity.

---

*Generated from `backend/src/models/*.ts` on 2026-09-12. If the models change, re-generate this file rather than hand-editing it out of sync.*
