export type Role = "super_admin" | "content_admin" | "editor" | "viewer";
export type ContentStatus = "draft" | "scheduled" | "published" | "archived";
export type AnnouncementPriority = "normal" | "important" | "urgent";
export type ContentType = "activity" | "event" | "news" | "album" | "video" | "announcement";

export interface Bilingual {
  en: string;
  te: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Category {
  _id: string;
  name: Bilingual;
  slug: string;
  appliesTo: ContentType[];
  isActive: boolean;
}

export interface MediaItem {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  type: "image" | "video";
  caption_en: string;
  caption_te: string;
}

export interface ContentBase {
  _id: string;
  status: ContentStatus;
  publishAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Activity extends ContentBase {
  title: Bilingual;
  description: Bilingual;
  date: string;
  time?: string;
  location: Bilingual;
  geo?: { lat: number | null; lng: number | null };
  category: Category | string | null;
  coverImage?: string;
  media: MediaItem[];
  externalLinks: string[];
  peopleInvolved: string[];
}

export interface EventItem extends ContentBase {
  title: Bilingual;
  description: Bilingual;
  date: string;
  startTime?: string;
  endTime?: string;
  location: Bilingual;
  address?: Bilingual;
  geo?: { lat: number | null; lng: number | null };
  media: MediaItem[];
  registrationInfo?: Bilingual;
}

export interface NewsItem extends ContentBase {
  title: Bilingual;
  summary: Bilingual;
  content: Bilingual;
  coverImage?: string;
  category: Category | string | null;
  author?: string;
  sourceUrl?: string;
}

export interface Album extends ContentBase {
  title: Bilingual;
  description?: Bilingual;
  date?: string;
  location?: Bilingual;
  coverImage?: string;
}

export interface Photo {
  _id: string;
  albumId: string;
  imageUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  caption: Bilingual;
  sortOrder: number;
}

export interface VideoItem extends ContentBase {
  title: Bilingual;
  description?: Bilingual;
  thumbnailUrl?: string;
  source: "youtube" | "hosted";
  videoUrl?: string;
  youtubeId?: string;
  category: Category | string | null;
}

export interface Announcement extends ContentBase {
  title: Bilingual;
  content: Bilingual;
  priority: AnnouncementPriority;
}

export interface DashboardStats {
  totalActivities: number;
  activitiesToday: number;
  totalEvents: number;
  upcomingEvents: number;
  totalPhotos: number;
  totalVideos: number;
  totalAnnouncements: number;
  notificationStats: { totalSent: number; totalFailed: number };
  recentNotifications: Array<{ _id: string; title: Bilingual; sentAt: string }>;
  recentlyPublished: Array<{ type: string; id: string; title: Bilingual; date: string }>;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}
