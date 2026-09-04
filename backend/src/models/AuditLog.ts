import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorEmail: string;
  action: string; // e.g. "create" | "update" | "delete" | "publish" | "unpublish" | "archive" | "login"
  entityType: string;
  // Usually a document ObjectId, but singleton entities (e.g. app_settings)
  // use a fixed string id — so this isn't always castable to ObjectId.
  entityId?: Types.ObjectId | string;
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
    entityId: { type: Schema.Types.Mixed },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
