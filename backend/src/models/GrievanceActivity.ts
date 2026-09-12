import { Schema, model, Document, Types } from "mongoose";

// An append-only timeline — every state change, assignment, comment, and
// citizen action writes one entry here and nothing is ever updated or
// deleted (§23 of the spec: "Never overwrite important historical events").
// isPublic controls whether an entry shows on the citizen-facing timeline
// (public updates) or only the admin detail view (internal notes) — one
// collection, filtered per audience, rather than two parallel arrays that
// could drift out of chronological sync with each other.
export interface IGrievanceActivity extends Document {
  _id: Types.ObjectId;
  grievanceId: Types.ObjectId;
  action: string;
  actorType: "citizen" | "admin" | "system";
  actorId: Types.ObjectId | null;
  actorName: string;
  message: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const grievanceActivitySchema = new Schema<IGrievanceActivity>(
  {
    grievanceId: { type: Schema.Types.ObjectId, ref: "Grievance", required: true, index: true },
    action: { type: String, required: true },
    actorType: { type: String, enum: ["citizen", "admin", "system"], required: true },
    actorId: { type: Schema.Types.ObjectId, default: null },
    actorName: { type: String, required: true },
    message: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

grievanceActivitySchema.index({ grievanceId: 1, createdAt: 1 });

export const GrievanceActivity = model<IGrievanceActivity>("GrievanceActivity", grievanceActivitySchema);
