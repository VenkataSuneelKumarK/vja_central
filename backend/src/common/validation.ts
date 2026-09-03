import { z } from "zod";

export const bilingual = (requireEn = true) =>
  z.object({
    en: requireEn ? z.string().min(1, "English text is required") : z.string().optional().default(""),
    te: z.string().optional().default(""),
  });

export const geo = z
  .object({ lat: z.number().nullable().optional(), lng: z.number().nullable().optional() })
  .optional();

export const mediaItem = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  mediumUrl: z.string().url().optional(),
  type: z.enum(["image", "video"]).default("image"),
  caption_en: z.string().optional().default(""),
  caption_te: z.string().optional().default(""),
});

export const statusEnum = z.enum(["draft", "scheduled", "published", "archived"]);

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
