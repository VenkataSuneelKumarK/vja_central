import { z } from "zod";
import { bilingual, statusEnum } from "@/common/validation";

export const createVideoSchema = z.object({
  body: z
    .object({
      title: bilingual(),
      description: bilingual(false),
      thumbnailUrl: z.string().url().optional(),
      source: z.enum(["youtube", "hosted"]),
      videoUrl: z.string().url().optional(),
      youtubeId: z.string().optional(),
      category: z.string().nullable().optional(),
      status: statusEnum.optional(),
      publishAt: z.coerce.date().nullable().optional(),
      expiresAt: z.coerce.date().nullable().optional(),
    })
    .refine((v) => (v.source === "youtube" ? !!v.youtubeId : !!v.videoUrl), {
      message: "youtubeId is required for YouTube videos, videoUrl for hosted videos",
    }),
});

export const updateVideoSchema = z.object({
  body: z.object({
    title: bilingual().optional(),
    description: bilingual(false).optional(),
    thumbnailUrl: z.string().url().optional(),
    source: z.enum(["youtube", "hosted"]).optional(),
    videoUrl: z.string().url().optional(),
    youtubeId: z.string().optional(),
    category: z.string().nullable().optional(),
    status: statusEnum.optional(),
    publishAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  }),
});

export const updateStatusSchema = z.object({ body: z.object({ status: statusEnum }) });
