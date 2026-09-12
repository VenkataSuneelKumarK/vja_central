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

export interface Department {
  _id: string;
  name: Bilingual;
  isActive: boolean;
}

export interface Officer {
  _id: string;
  name: string;
  mobile?: string;
  department: string | Department;
  isActive: boolean;
}

export interface GrievanceSlaConfig {
  emergencyHours: number;
  highHours: number;
  normalHours: number;
  suggestionHours: number;
}

export interface Grievance {
  _id: string;
  grievanceNumber: string;
  year: number;
  sequenceNumber: number;
  citizenId: string;
  citizenName: string;
  citizenMobile: string;
  heading: string;
  description: string;
  category: GrievanceCategoryRef | string;
  subCategory?: string;
  customCategoryNote?: string;
  initialPriority: GrievancePriority;
  priority: GrievancePriority;
  priorityChangeReason?: string;
  status: GrievanceStatus;
  area?: string;
  ward?: string;
  landmark?: string;
  geo: { lat: number | null; lng: number | null };
  attachments: GrievanceAttachment[];
  department: Department | string | null;
  assignedOfficer: Officer | string | null;
  assignedOfficerName?: string;
  assignedAt: string | null;
  dueDate: string | null;
  dueDateOverridden: boolean;
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

export interface GrievanceDashboardStats {
  total: number;
  resolved: number;
  pending: number;
  overdue: number;
  resolutionRate: number;
  avgResolutionDays: number | null;
  priorityBreakdown: Record<GrievancePriority, number>;
}
