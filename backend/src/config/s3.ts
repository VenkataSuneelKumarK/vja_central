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

export function publicUrlFor(key: string): string {
  if (env.CDN_URL) return `${env.CDN_URL.replace(/\/$/, "")}/${key}`;
  return `https://${MEDIA_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}
