import { z } from "zod";
import { bilingual, statusEnum } from "@/common/validation";
import { ANNOUNCEMENT_PRIORITIES } from "@/common/constants";

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: bilingual(),
    content: bilingual(),
    priority: z.enum(ANNOUNCEMENT_PRIORITIES).optional(),
    status: statusEnum.optional(),
    publishAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  }),
});

export const updateAnnouncementSchema = z.object({ body: createAnnouncementSchema.shape.body.partial() });
export const updateStatusSchema = z.object({ body: z.object({ status: statusEnum }) });
