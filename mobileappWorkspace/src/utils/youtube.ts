// Extracts the video ID from any common YouTube URL shape. Used as a
// defensive fallback for videos where a YouTube link was pasted into the
// "hosted URL" field in the admin portal instead of the dedicated YouTube
// source option — an HTML5 <video> tag can't play a youtube.com/youtu.be
// page URL (it's not a direct video file), so without this the video would
// silently fail to play.
export function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
