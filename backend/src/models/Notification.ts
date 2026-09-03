import { Schema, model, Document, Types } from "mongoose";
import { bilingualField } from "@/common/schemaHelpers";
import { CONTENT_TYPES } from "@/common/constants";

export interface INotification extends Document {
  _id: Types.ObjectId;
  title: { en: string; te: string };
  body: { en: string; te: string };
  contentType: string;
  contentId?: Types.ObjectId;
  status: "sent" | "failed";
  successCount: number;
  failureCount: number;
  sentBy: Types.ObjectId;
  sentAt: Date;
}

const notificationSchema = new Schema<INotification>({
  title: bilingualField(),
  body: bilingualField(),
  contentType: { type: String, enum: [...CONTENT_TYPES, "general"] },
  contentId: { type: Schema.Types.ObjectId },
  status: { type: String, enum: ["sent", "failed"], default: "sent" },
  successCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
  sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sentAt: { type: Date, default: Date.now, index: true },
});

export const Notification = model<INotification>("Notification", notificationSchema);
