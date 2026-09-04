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
};

export function StatIcon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
