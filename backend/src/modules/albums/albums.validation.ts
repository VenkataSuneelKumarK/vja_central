import { z } from "zod";
import { bilingual, statusEnum } from "@/common/validation";

export const createAlbumSchema = z.object({
  body: z.object({
    title: bilingual(),
    description: bilingual(false),
    date: z.coerce.date().optional(),
    location: bilingual(false),
    coverImage: z.string().url().optional(),
    status: statusEnum.optional(),
    publishAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  }),
});

export const updateAlbumSchema = z.object({ body: createAlbumSchema.shape.body.partial() });
export const updateStatusSchema = z.object({ body: z.object({ status: statusEnum }) });

export const addPhotosSchema = z.object({
  body: z.object({
    photos: z
      .array(
        z.object({
          imageUrl: z.string().url(),
          thumbnailUrl: z.string().url(),
          mediumUrl: z.string().url(),
          caption_en: z.string().optional().default(""),
          caption_te: z.string().optional().default(""),
        })
      )
      .min(1),
  }),
});

export const reorderPhotosSchema = z.object({
  body: z.object({
    order: z.array(z.object({ id: z.string(), sortOrder: z.number() })).min(1),
  }),
});

export const updatePhotoSchema = z.object({
  body: z.object({
    caption_en: z.string().optional(),
    caption_te: z.string().optional(),
  }),
});
