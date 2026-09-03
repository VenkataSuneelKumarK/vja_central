import { z } from "zod";
import { bilingual, geo, mediaItem, statusEnum } from "@/common/validation";

export const createActivitySchema = z.object({
  body: z.object({
    title: bilingual(),
    description: bilingual(),
    date: z.coerce.date(),
    time: z.string().optional(),
    location: bilingual(),
    geo,
    category: z.string().nullable().optional(),
    coverImage: z.string().url().optional(),
    media: z.array(mediaItem).optional().default([]),
    externalLinks: z.array(z.string().url()).optional().default([]),
    peopleInvolved: z.array(z.string()).optional().default([]),
    status: statusEnum.optional(),
    publishAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  }),
});

export const updateActivitySchema = z.object({
  body: createActivitySchema.shape.body.partial(),
});

export const updateStatusSchema = z.object({
  body: z.object({ status: statusEnum }),
});
