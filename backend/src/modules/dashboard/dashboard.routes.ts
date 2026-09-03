import { Router } from "express";
import { Activity } from "@/models/Activity";
import { Event } from "@/models/Event";
import { News } from "@/models/News";
import { Photo } from "@/models/Photo";
import { Video } from "@/models/Video";
import { Announcement } from "@/models/Announcement";
import { Notification } from "@/models/Notification";
import { asyncHandler } from "@/common/asyncHandler";
import { ok } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { DASHBOARD_ROLES } from "@/common/constants";

const router = Router();
router.use(requireAuth, requireRole(DASHBOARD_ROLES));

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const now = new Date();

    const [
      totalActivities,
      activitiesToday,
      totalEvents,
      upcomingEvents,
      totalPhotos,
      totalVideos,
      totalAnnouncements,
      recentNotifications,
    ] = await Promise.all([
      Activity.countDocuments({ status: "published" }),
      Activity.countDocuments({ status: "published", publishAt: { $gte: startOfToday } }),
      Event.countDocuments({ status: "published" }),
      Event.countDocuments({ status: "published", date: { $gte: now } }),
      Photo.countDocuments(),
      Video.countDocuments({ status: "published" }),
      Announcement.countDocuments({ status: "published" }),
      Notification.find().sort({ sentAt: -1 }).limit(5),
    ]);

    const notificationStats = await Notification.aggregate([
      { $group: { _id: null, totalSent: { $sum: "$successCount" }, totalFailed: { $sum: "$failureCount" } } },
    ]);

    // Recently published content across all types — a lightweight fan-in
    // query rather than a separate "activity feed" collection.
    const [recentActivities, recentEvents, recentNews] = await Promise.all([
      Activity.find({ status: "published" }).sort({ publishAt: -1 }).limit(5).select("title publishAt"),
      Event.find({ status: "published" }).sort({ createdAt: -1 }).limit(5).select("title createdAt"),
      News.find({ status: "published" }).sort({ publishAt: -1 }).limit(5).select("title publishAt"),
    ]);

    ok(res, {
      totalActivities,
      activitiesToday,
      totalEvents,
      upcomingEvents,
      totalPhotos,
      totalVideos,
      totalAnnouncements,
      notificationStats: notificationStats[0] ?? { totalSent: 0, totalFailed: 0 },
      recentNotifications,
      recentlyPublished: [
        ...recentActivities.map((a) => ({ type: "activity", id: a._id, title: a.title, date: a.publishAt })),
        ...recentEvents.map((e) => ({ type: "event", id: e._id, title: e.title, date: e.createdAt })),
        ...recentNews.map((n) => ({ type: "news", id: n._id, title: n.title, date: n.publishAt })),
      ]
        .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
        .slice(0, 10),
    });
  })
);

export const dashboardAdminRouter = router;
