import { z } from "zod";
import { GRIEVANCE_PRIORITIES, GRIEVANCE_STATUSES } from "@/common/constants";
import { objectId } from "@/common/validation";

const attachmentInput = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  mediumUrl: z.string().url().optional(),
  fileName: z.string(),
  fileType: z.string(),
});

export const createGrievanceSchema = z.object({
  body: z
    .object({
      heading: z.string().min(5, "Heading must be at least 5 characters").max(150),
      description: z.string().min(10, "Please describe the issue in more detail").max(4000),
      category: objectId,
      subCategory: z.string().optional(),
      customCategoryNote: z.string().max(500).optional(),
      priority: z.enum(GRIEVANCE_PRIORITIES).default("normal"),
      area: z.string().max(200).optional(),
      ward: z.string().max(50).optional(),
      landmark: z.string().max(200).optional(),
      geo: z.object({ lat: z.number().nullable().optional(), lng: z.number().nullable().optional() }).optional(),
      attachments: z.array(attachmentInput).max(5, "A maximum of 5 attachments is allowed").optional().default([]),
    })
    .refine((data) => data.subCategory || data.customCategoryNote, {
      message: "Select a sub-category, or choose Others and describe the issue",
      path: ["subCategory"],
    }),
});

export const assignGrievanceSchema = z.object({
  body: z.object({
    department: objectId,
    assignedOfficer: objectId.optional(),
    dueDate: z.coerce.date().optional(),
    internalNote: z.string().max(1000).optional(),
  }),
});

export const priorityChangeSchema = z.object({
  body: z.object({
    priority: z.enum(GRIEVANCE_PRIORITIES),
    reason: z.string().min(5, "A reason is required when changing priority").max(500),
  }),
});

export const statusChangeSchema = z.object({
  body: z.object({
    status: z.enum(GRIEVANCE_STATUSES),
    note: z.string().max(1000).optional(),
  }),
});

export const resolveGrievanceSchema = z.object({
  body: z.object({
    resolutionDescription: z.string().min(10, "Describe how the issue was resolved").max(2000),
    resolutionAttachments: z.array(attachmentInput).max(5).optional().default([]),
  }),
});

export const rejectGrievanceSchema = z.object({
  body: z.object({
    rejectionReason: z.string().min(5, "A rejection reason is required").max(1000),
  }),
});

export const commentSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(1000),
    isPublic: z.boolean().default(true),
  }),
});

export const citizenVerifySchema = z.object({
  body: z.object({
    resolved: z.boolean(),
    reopenReason: z.string().max(1000).optional(),
  }),
});

export const feedbackSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

export const slaConfigSchema = z.object({
  body: z.object({
    emergencyHours: z.number().positive(),
    highHours: z.number().positive(),
    normalHours: z.number().positive(),
    suggestionHours: z.number().positive(),
  }),
});
