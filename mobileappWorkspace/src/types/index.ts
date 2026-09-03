export interface Bilingual {
  en: string;
  te: string;
}

export interface Category {
  _id: string;
  name: Bilingual;
  slug: string;
}

export interface MediaItem {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  type: "image" | "video";
  caption_en: string;
  caption_te: string;
}

interface ContentBase {
  _id: string;
  publishAt: string | null;
  createdAt: string;
}

export interface Activity extends ContentBase {
  title: Bilingual;
  description: Bilingual;
  date: string;
  time?: string;
  location: Bilingual;
  geo?: { lat: number | null; lng: number | null };
  category: Category | null;
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
  category: Category | null;
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
  category: Category | null;
}

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement extends ContentBase {
  title: Bilingual;
  content: Bilingual;
  priority: AnnouncementPriority;
}

export interface HomeData {
  latestActivities: Activity[];
  upcomingEvents: EventItem[];
  latestNews: NewsItem[];
  activeAnnouncements: Announcement[];
  featuredAlbums: Album[];
  featuredVideos: VideoItem[];
}

export interface AppSettings {
  logoUrl?: string;
  profileImageUrl?: string;
  splashImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks?: { facebook?: string; twitter?: string; instagram?: string; youtube?: string };
  privacyPolicyUrl?: string;
  termsUrl?: string;
}

export type SupportedLanguage = "en" | "te";
