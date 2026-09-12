import multer from "multer";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { s3, MEDIA_BUCKET, publicUrlFor } from "@/config/s3";
import { env } from "@/config/env";
import { ApiError } from "@/common/apiResponse";

export const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export function createImageUploadMulter(opts: { maxFiles: number; maxSizeMb?: number }) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: (opts.maxSizeMb ?? env.MAX_UPLOAD_MB) * 1024 * 1024, files: opts.maxFiles },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
        cb(new Error("Only JPG, PNG and WebP images are allowed"));
        return;
      }
      cb(null, true);
    },
  });
}

async function uploadVariant(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await s3
    .putObject({ Bucket: MEDIA_BUCKET, Key: key, Body: buffer, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" })
    .promise();
  return publicUrlFor(key);
}

// Validates real image content (via sharp, which parses the file rather
// than trusting the extension/MIME header — §18/§21 of the original brief),
// then generates thumbnail/medium/original variants at upload time so
// clients never resize images on the fly. Shared by the admin content
// media endpoint and the citizen grievance-attachment endpoint so both
// paths get identical validation and output shape.
export async function processAndUploadImage(fileBuffer: Buffer, originalName: string) {
  const id = randomUUID();
  const ext = "webp";

  try {
    const image = sharp(fileBuffer, { failOn: "error" });
    await image.metadata();
  } catch {
    throw ApiError.badRequest(`"${originalName}" is not a valid image file`);
  }

  const [thumbnail, medium, original] = await Promise.all([
    sharp(fileBuffer).resize(200, 200, { fit: "cover" }).webp({ quality: 75 }).toBuffer(),
    sharp(fileBuffer).resize(800, 800, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    sharp(fileBuffer).webp({ quality: 90 }).toBuffer(),
  ]);

  const [thumbnailUrl, mediumUrl, imageUrl] = await Promise.all([
    uploadVariant(thumbnail, `media/${id}/thumbnail.${ext}`, "image/webp"),
    uploadVariant(medium, `media/${id}/medium.${ext}`, "image/webp"),
    uploadVariant(original, `media/${id}/original.${ext}`, "image/webp"),
  ]);

  return { id, imageUrl, thumbnailUrl, mediumUrl, fileName: originalName };
}
