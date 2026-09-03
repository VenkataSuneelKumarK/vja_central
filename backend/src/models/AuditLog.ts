import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorEmail: string;
  action: string; // e.g. "create" | "update" | "delete" | "publish" | "unpublish" | "archive" | "login"
  entityType: string;
  entityId?: Types.ObjectId;
  before?: unknown;
  after?: unknown;
  ip?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
