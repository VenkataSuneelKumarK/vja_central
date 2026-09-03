import { createResourceHooks } from "./resource";
import { Activity, EventItem, NewsItem, Album, VideoItem, Announcement } from "@/types";

export const activityResource = createResourceHooks<Activity>("/admin/activities", "activities");
export const eventResource = createResourceHooks<EventItem>("/admin/events", "events");
export const newsResource = createResourceHooks<NewsItem>("/admin/news", "news");
export const albumResource = createResourceHooks<Album>("/admin/albums", "albums");
export const videoResource = createResourceHooks<VideoItem>("/admin/videos", "videos");
export const announcementResource = createResourceHooks<Announcement>("/admin/announcements", "announcements");
