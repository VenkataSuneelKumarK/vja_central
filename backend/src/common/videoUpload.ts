import multer from "multer";
import os from "os";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { s3, MEDIA_BUCKET, publicUrlFor } from "@/config/s3";
import { env } from "@/config/env";
import { ApiError } from "@/common/apiResponse";

const execFileAsync = promisify(execFile);

export const ALLOWED_VIDEO_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-m4v": "m4v",
};

// Videos are streamed to disk (not buffered in memory like images) — a
// 200MB upload held entirely in RAM per concurrent request would be a easy
// way to OOM the API process under any real load.
const uploadDir = path.join(os.tmpdir(), "vja-video-uploads");
fs.mkdirSync(uploadDir, { recursive: true });

export function createVideoUploadMulter() {
  return multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req, _file, cb) => cb(null, `${randomUUID()}.upload`),
    }),
    limits: { fileSize: env.MAX_VIDEO_UPLOAD_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_VIDEO_MIME[file.mimetype]) {
        cb(new Error("Only MP4, MOV, WebM and M4V videos are allowed"));
        return;
      }
      cb(null, true);
    },
  });
}

// Grabs one frame as a JPEG so uploaded videos get a real preview image on
// the Home screen and in the gallery list, the same way YouTube videos get
// one from oEmbed — without this, an uploaded video's card is just a blank
// placeholder box until someone opens it. Best-effort: if ffmpeg isn't on
// PATH (or the frame grab fails for any reason), the upload still succeeds
// with no thumbnailUrl, matching the previous no-thumbnail behavior.
async function extractFrame(videoPath: string, atSeconds: number): Promise<Buffer> {
  const thumbPath = path.join(os.tmpdir(), `${randomUUID()}.jpg`);
  try {
    await execFileAsync("ffmpeg", ["-y", "-ss", String(atSeconds), "-i", videoPath, "-frames:v", "1", "-update", "1", "-vf", "scale=480:-1", thumbPath]);
    return fs.readFileSync(thumbPath);
  } finally {
    fs.unlink(thumbPath, () => undefined);
  }
}

async function generateThumbnail(videoPath: string): Promise<Buffer | null> {
  try {
    return await extractFrame(videoPath, 0.5);
  } catch {
    try {
      return await extractFrame(videoPath, 0);
    } catch {
      return null;
    }
  }
}

export async function processAndUploadVideo(
  filePath: string,
  originalName: string,
  mimeType: string
): Promise<{ id: string; videoUrl: string; thumbnailUrl?: string; fileName: string }> {
  const ext = ALLOWED_VIDEO_MIME[mimeType];
  if (!ext) throw ApiError.badRequest("Unsupported video type");

  const id = randomUUID();
  const key = `media/${id}/original.${ext}`;
  const stats = fs.statSync(filePath);

  let thumbnailUrl: string | undefined;
  try {
    const [, thumbnail] = await Promise.all([
      s3
        .upload({
          Bucket: MEDIA_BUCKET,
          Key: key,
          Body: fs.createReadStream(filePath),
          ContentType: mimeType,
          ContentLength: stats.size,
          CacheControl: "public, max-age=31536000, immutable",
        })
        .promise(),
      generateThumbnail(filePath),
    ]);

    if (thumbnail) {
      const thumbnailKey = `media/${id}/thumbnail.jpg`;
      await s3
        .putObject({
          Bucket: MEDIA_BUCKET,
          Key: thumbnailKey,
          Body: thumbnail,
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
        })
        .promise();
      thumbnailUrl = publicUrlFor(thumbnailKey);
    }
  } finally {
    fs.unlink(filePath, () => undefined);
  }

  return { id, videoUrl: publicUrlFor(key), thumbnailUrl, fileName: originalName };
}
