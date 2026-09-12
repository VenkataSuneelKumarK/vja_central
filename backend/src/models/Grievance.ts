import { Schema, model, Document, Types } from "mongoose";
import { GRIEVANCE_STATUSES, GRIEVANCE_PRIORITIES } from "@/common/constants";

export interface IGrievanceAttachment {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  fileName: string;
  fileType: string;
  uploadedAt: Date;
}

export interface IGrievance extends Document {
  _id: Types.ObjectId;
  grievanceNumber: string;
  year: number;
  sequenceNumber: number;

  // Reference is the source of truth; name/mobile are a point-in-time
  // snapshot for historical reporting so old grievances still display
  // correctly even if a citizen later edits their profile (§14 of the spec).
  citizenId: Types.ObjectId;
  citizenName: string;
  citizenMobile: string;

  heading: string;
  description: string;
  category: Types.ObjectId;
  subCategory?: string;
  customCategoryNote?: string;

  initialPriority: string; // as submitted by the citizen — never mutated
  priority: string; // current/effective priority — admin may override
  priorityChangeReason?: string;

  status: string;

  area?: string;
  ward?: string;
  landmark?: string;
  geo: { lat: number | null; lng: number | null };

  attachments: IGrievanceAttachment[];

  department: Types.ObjectId | null;
  assignedOfficer: Types.ObjectId | null;
  assignedOfficerName?: string;
  assignedBy: Types.ObjectId | null;
  assignedAt: Date | null;

  dueDate: Date | null;
  dueDateOverridden: boolean;

  resolutionDescription?: string;
  resolutionAttachments: IGrievanceAttachment[];

  citizenFeedback?: string;
  citizenRating?: number;

  rejectionReason?: string;
  reopenReason?: string;
  reopenCount: number;

  createdBy: Types.ObjectId; // citizenId, duplicated here to match the spec's field list literally
  updatedBy: Types.ObjectId | null; // last admin/staff to modify

  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  verifiedAt: Date | null;
  closedAt: Date | null;
}

const attachmentSchema = new Schema<IGrievanceAttachment>(
  {
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    mediumUrl: { type: String },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const grievanceSchema = new Schema<IGrievance>(
  {
    grievanceNumber: { type: String, required: true, unique: true },
    year: { type: Number, required: true, index: true },
    sequenceNumber: { type: Number, required: true },

    citizenId: { type: Schema.Types.ObjectId, ref: "Citizen", required: true, index: true },
    citizenName: { type: String, required: true },
    citizenMobile: { type: String, required: true },

    heading: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "GrievanceCategory", required: true, index: true },
    subCategory: { type: String },
    customCategoryNote: { type: String },

    initialPriority: { type: String, enum: GRIEVANCE_PRIORITIES, required: true },
    priority: { type: String, enum: GRIEVANCE_PRIORITIES, required: true, index: true },
    priorityChangeReason: { type: String },

    status: { type: String, enum: GRIEVANCE_STATUSES, default: "open", index: true },

    area: { type: String },
    ward: { type: String, index: true },
    landmark: { type: String },
    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    attachments: [attachmentSchema],

    department: { type: Schema.Types.ObjectId, ref: "Department", default: null, index: true },
    assignedOfficer: { type: Schema.Types.ObjectId, ref: "Officer", default: null, index: true },
    assignedOfficerName: { type: String },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignedAt: { type: Date, default: null },

    dueDate: { type: Date, default: null, index: true },
    dueDateOverridden: { type: Boolean, default: false },

    resolutionDescription: { type: String },
    resolutionAttachments: [attachmentSchema],

    citizenFeedback: { type: String },
    citizenRating: { type: Number, min: 1, max: 5 },

    rejectionReason: { type: String },
    reopenReason: { type: String },
    reopenCount: { type: Number, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: "Citizen", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    resolvedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes matching §39 of the spec — every field the admin filters/sorts by.
grievanceSchema.index({ status: 1, createdAt: -1 });
grievanceSchema.index({ priority: 1, status: 1 });
grievanceSchema.index({ citizenId: 1, status: 1 });
grievanceSchema.index({ createdAt: -1 });
grievanceSchema.index(
  { heading: "text", description: "text", citizenName: "text", grievanceNumber: "text" },
  { name: "grievance_text_search" }
);

export const Grievance = model<IGrievance>("Grievance", grievanceSchema);
