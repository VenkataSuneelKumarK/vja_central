import { z } from "zod";
import { bilingual, statusEnum } from "@/common/validation";

export const createNewsSchema = z.object({
  body: z.object({
    title: bilingual(),
    summary: bilingual(),
    content: bilingual(),
    coverImage: z.string().url().optional(),
    category: z.string().nullable().optional(),
    author: z.string().optional(),
    sourceUrl: z.string().url().optional().or(z.literal("")),
    status: statusEnum.optional(),
    publishAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  }),
});

export const updateNewsSchema = z.object({ body: createNewsSchema.shape.body.partial() });
export const updateStatusSchema = z.object({ body: z.object({ status: statusEnum }) });
