import { Router } from "express";
import { Activity } from "@/models/Activity";
import { Event } from "@/models/Event";
import { News } from "@/models/News";
import { Album } from "@/models/Album";
import { Video } from "@/models/Video";
import { Announcement } from "@/models/Announcement";
import { asyncHandler } from "@/common/asyncHandler";
import { ok } from "@/common/apiResponse";

const publishedNotExpired = (now: Date) => ({
  status: "published" as const,
  $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
});

// Single round-trip for the entire home screen (§36 of the brief) — the
// mobile app should never fire six separate requests just to paint the
// first screen it shows a user.
export const homeRouter = Router();

homeRouter.get(
  "/home",
  asyncHandler(async (_req, res) => {
    const now = new Date();

    const [latestActivities, upcomingEvents, latestNews, activeAnnouncements, featuredAlbums, featuredVideos] =
      await Promise.all([
        Activity.find(publishedNotExpired(now)).sort({ publishAt: -1 }).limit(5),
        Event.find({ status: "published", date: { $gte: now } }).sort({ date: 1 }).limit(5),
        News.find(publishedNotExpired(now)).sort({ publishAt: -1 }).limit(5),
        Announcement.find(publishedNotExpired(now)).sort({ priority: 1, publishAt: -1 }).limit(5),
        Album.find(publishedNotExpired(now)).sort({ publishAt: -1 }).limit(6),
        Video.find(publishedNotExpired(now)).sort({ publishAt: -1 }).limit(6),
      ]);

    ok(res, { latestActivities, upcomingEvents, latestNews, activeAnnouncements, featuredAlbums, featuredVideos });
  })
);
