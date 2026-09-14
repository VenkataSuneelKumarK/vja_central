import AWS from "aws-sdk";
import { env } from "./env";

// Works against real AWS S3 in production, or a local MinIO container in
// development (MinIO speaks the S3 API) — controlled entirely by env vars,
// so no code change is needed when promoting to production.
export const s3 = new AWS.S3({
  region: env.AWS_REGION,
  endpoint: env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
});

export const MEDIA_BUCKET = env.AWS_S3_BUCKET;

// The permanent, public-style URL used as the *stored* representation of
// every media reference (in Mongo documents) — unchanged regardless of
// AWS_S3_PRIVATE, so upload code never needs to know or care which mode is
// active. What actually goes out over the wire to a client is decided
// separately, at response time, by signMediaUrl()/signMediaUrlsDeep() below.
export function publicUrlFor(key: string): string {
  if (env.CDN_URL) return `${env.CDN_URL.replace(/\/$/, "")}/${key}`;
  return `https://${MEDIA_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

const MEDIA_URL_PREFIX = env.CDN_URL ? `${env.CDN_URL.replace(/\/$/, "")}/` : null;

// Turns one stored media URL into a short-lived signed link, if (and only
// if) it actually points at our own bucket — anything else (a YouTube
// thumbnail URL, plain text, etc.) is returned untouched. A no-op entirely
// when AWS_S3_PRIVATE is off, so public/local setups pay zero cost for this.
export async function signMediaUrl(value: string): Promise<string> {
  if (!env.AWS_S3_PRIVATE || !MEDIA_URL_PREFIX || !value.startsWith(MEDIA_URL_PREFIX)) return value;
  // Strip any query string before deriving the key so a value that was
  // already signed once (e.g. a signed upload-preview URL a client
  // mistakenly persisted as if it were the permanent URL) still resolves
  // to the real object key instead of being treated as a literal key that
  // happens to contain "?X-Amz-...".
  const key = value.slice(MEDIA_URL_PREFIX.length).split("?")[0];
  try {
    return await s3.getSignedUrlPromise("getObject", {
      Bucket: MEDIA_BUCKET,
      Key: key,
      Expires: env.S3_SIGNED_URL_EXPIRES_SECONDS,
    });
  } catch {
    // Signing failure (bad key, S3 unreachable, etc.) shouldn't take the
    // whole API response down — fall back to the stored (unusable-if-truly-
    // private, but at least not a 500) URL rather than throwing here.
    return value;
  }
}

// Recursively walks any JSON-shaped value (the plain object graph a
// response body will serialize to) and signs every string that looks like
// one of our media URLs, wherever it's nested — one call site instead of
// hunting down every coverImage/thumbnailUrl/videoUrl/attachments[].url
// field across every content type.
export async function signMediaUrlsDeep<T>(value: T): Promise<T> {
  if (!env.AWS_S3_PRIVATE) return value;
  if (typeof value === "string") return (await signMediaUrl(value)) as unknown as T;
  if (Array.isArray(value)) return (await Promise.all(value.map((v) => signMediaUrlsDeep(v)))) as unknown as T;
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(async ([k, v]) => [k, await signMediaUrlsDeep(v)] as const)
    );
    return Object.fromEntries(entries) as T;
  }
  return value;
}
