// Small stroke-style icon set for dashboard stat cards (Option B / "accent"
// dashboard style) — one consistent 24px-grid, 1.9 stroke-width look.
const PATHS: Record<string, string> = {
  activities: "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1ZM6 7h12v13H6V7Zm3 4h6M9 14h6M9 17h4",
  published: "M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  events: "M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z",
  upcoming: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v4l3 2",
  photos: "M4 6h16v12H4V6Zm3 9 3.5-4 2.5 3 2-2 4 3H7Zm2-6.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z",
  videos: "M4 6h11v12H4V6Zm11 4 5-3v10l-5-3v-4Z",
  announcements: "M4 10v4h3l5 4V6L7 10H4Zm11-2a5 5 0 0 1 0 8",
  notifications: "M12 4a5 5 0 0 0-5 5v3l-1.5 3h13L17 12V9a5 5 0 0 0-5-5Zm-2 13a2 2 0 0 0 4 0",
  dashboard: "M4 4h7v7H4V4Zm9 0h7v4h-7V4Zm0 7h7v9h-7v-9ZM4 14h7v6H4v-6Z",
  news: "M5 4h11l3 3v13H5V4Zm11 0v3h3M9 11h6M9 14h6M9 17h4",
  categories: "M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5M15 19c.3-2.3 1.5-4 3.5-4.6.8.4 1.5 1.1 2 2.1.3.6.5 1.5.5 2.5",
  audit: "M6 3h9l3 3v15H6V3Zm9 0v3h3M9 10h6M9 13h6M9 16h3",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3c0 .4 0 .8-.1 1.2l2 1.5-2 3.4-2.3-1a7 7 0 0 1-2 1.2l-.4 2.5H9.8l-.4-2.5a7 7 0 0 1-2-1.2l-2.3 1-2-3.4 2-1.5A7 7 0 0 1 5 12c0-.4 0-.8.1-1.2l-2-1.5 2-3.4 2.3 1a7 7 0 0 1 2-1.2L9.8 3h4.4l.4 2.5a7 7 0 0 1 2 1.2l2.3-1 2 3.4-2 1.5c.1.4.1.8.1 1.2Z",
};

export function StatIcon({ name, size = 16 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
