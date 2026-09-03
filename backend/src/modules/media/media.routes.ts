import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { s3, MEDIA_BUCKET, publicUrlFor } from "@/config/s3";
import { env } from "@/config/env";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { WRITE_ROLES } from "@/common/constants";

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(new Error("Only JPG, PNG and WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

async function uploadVariant(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await s3
    .putObject({ Bucket: MEDIA_BUCKET, Key: key, Body: buffer, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" })
    .promise();
  return publicUrlFor(key);
}

// Validates real image content (via sharp, which parses the file rather
// than trusting the extension/MIME header — §18/§21 of the brief), then
// generates thumbnail/medium/original variants at upload time so the
// mobile app never resizes images on the fly.
async function processAndUploadImage(fileBuffer: Buffer, originalName: string) {
  const id = randomUUID();
  const ext = "webp"; // normalize everything to webp for consistent, small output

  let image: sharp.Sharp;
  try {
    image = sharp(fileBuffer, { failOn: "error" });
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

  return { id, imageUrl, thumbnailUrl, mediumUrl };
}

const router = Router();
router.use(requireAuth, requireRole(WRITE_ROLES));

router.post(
  "/upload",
  upload.array("files", 20),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw ApiError.badRequest("No files uploaded");

    const results = await Promise.all(files.map((f) => processAndUploadImage(f.buffer, f.originalname)));
    ok(res, results, 201);
  })
);

export const mediaAdminRouter = router;
