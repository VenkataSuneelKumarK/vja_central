import { z } from "zod";
import { bilingual, geo, mediaItem, statusEnum } from "@/common/validation";

export const createEventSchema = z.object({
  body: z.object({
    title: bilingual(),
    description: bilingual(),
    date: z.coerce.date(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: bilingual(),
    address: bilingual(false),
    geo,
    media: z.array(mediaItem).optional().default([]),
    registrationInfo: bilingual(false).optional(),
    status: statusEnum.optional(),
    publishAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  }),
});

export const updateEventSchema = z.object({ body: createEventSchema.shape.body.partial() });
export const updateStatusSchema = z.object({ body: z.object({ status: statusEnum }) });
