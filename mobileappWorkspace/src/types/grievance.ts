import { Bilingual } from "@/types";

export type GrievanceStatus = "open" | "assigned" | "in_progress" | "resolved" | "verified" | "reopened" | "closed" | "rejected";
export type GrievancePriority = "emergency" | "high" | "normal" | "suggestion";
export type SlaState = "on_track" | "due_soon" | "overdue" | null;

export interface GrievanceAttachment {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
}

export interface GrievanceSubCategory {
  name: Bilingual;
  slug: string;
}

export interface GrievanceCategory {
  _id: string;
  name: Bilingual;
  slug: string;
  isOther: boolean;
  subCategories: GrievanceSubCategory[];
  isActive: boolean;
  sortOrder: number;
}

export interface GrievanceCategoryRef {
  _id: string;
  name: Bilingual;
  slug: string;
}

export interface GrievanceDepartmentRef {
  _id: string;
  name: Bilingual;
}

export interface GrievanceOfficerRef {
  _id: string;
  name: string;
}

export interface Grievance {
  _id: string;
  grievanceNumber: string;
  heading: string;
  description: string;
  category: GrievanceCategoryRef | string;
  subCategory?: string;
  customCategoryNote?: string;
  initialPriority: GrievancePriority;
  priority: GrievancePriority;
  status: GrievanceStatus;
  area?: string;
  ward?: string;
  landmark?: string;
  geo: { lat: number | null; lng: number | null };
  attachments: GrievanceAttachment[];
  department: GrievanceDepartmentRef | string | null;
  assignedOfficer: GrievanceOfficerRef | string | null;
  assignedOfficerName?: string;
  dueDate: string | null;
  slaState: SlaState;
  resolutionDescription?: string;
  resolutionAttachments: GrievanceAttachment[];
  citizenFeedback?: string;
  citizenRating?: number;
  rejectionReason?: string;
  reopenReason?: string;
  reopenCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  verifiedAt: string | null;
  closedAt: string | null;
}

export interface GrievanceActivity {
  _id: string;
  grievanceId: string;
  action: string;
  actorType: "citizen" | "admin" | "system";
  actorName: string;
  message: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UploadedAttachment {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  fileName: string;
}
