# Admin Portal Navigation

```
/login

/                          Dashboard (stats, recent activity)
/activities                list (filter: status/category/date)
/activities/new            create
/activities/:id            edit + preview + publish/schedule/archive
/grievances                Praja Samvad — KPI strip + filterable list (status/priority/
                           category/sub-category/ward/area/department/officer/date/search)
/grievances/:id            detail — citizen info, attachments, timeline, and (content_admin+)
                           assignment, priority override, status/resolve/reject, comments
/grievances/settings       super_admin only — departments, officers, per-priority SLA hours
/events                    list
/events/new | /events/:id
/news                      list
/news/new | /news/:id
/gallery/albums            list
/gallery/albums/new | /:id  (includes photo grid: upload/reorder/caption/delete)
/gallery/videos            list
/gallery/videos/new | /:id
/announcements             list
/announcements/new | /:id
/notifications             send + history
/categories                manage content categories (all roles: read; super_admin/content_admin: write)
/users                     super_admin only — manage admin accounts & roles
/audit-log                 super_admin only — full audit trail, filterable
/settings                  branding (logo, colors, splash), app config
```

Sidebar visibility and every write action are gated by role:

| Route / action | super_admin | content_admin | editor | viewer |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create/edit content | ✅ | ✅ | ✅ (draft only) | ❌ |
| Publish/unpublish/archive | ✅ | ✅ | ❌ | ❌ |
| Delete content | ✅ | ✅ | ❌ | ❌ |
| Send notifications | ✅ | ✅ | ❌ | ❌ |
| View grievances | ✅ | ✅ | ✅ | ✅ |
| Assign / change priority-status / resolve / reject a grievance | ✅ | ✅ | ❌ | ❌ |
| Manage departments / officers / SLA config | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Audit log | ✅ | ❌ | ❌ | ❌ |

Every content edit screen has three tabs: **Edit** (English/Telugu side by
side), **Media**, **Preview** (renders the same card/detail layout the
mobile app uses, via shared preview components) — satisfying §37 of the
brief before anything is published.
