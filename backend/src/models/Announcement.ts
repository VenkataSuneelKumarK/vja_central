import { Schema, model, Document, Types } from "mongoose";
import { bilingualField, publishFields } from "@/common/schemaHelpers";
import { ANNOUNCEMENT_PRIORITIES } from "@/common/constants";

export interface IAnnouncement extends Document {
  _id: Types.ObjectId;
  title: { en: string; te: string };
  content: { en: string; te: string };
  priority: string;
  status: string;
  publishAt: Date | null;
  expiresAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: bilingualField(),
    content: bilingualField(),
    priority: { type: String, enum: ANNOUNCEMENT_PRIORITIES, default: "normal" },
    ...publishFields,
  },
  { timestamps: true }
);

announcementSchema.index({ status: 1, priority: 1, publishAt: -1 });
announcementSchema.index({ "title.en": "text", "title.te": "text", "content.en": "text" }, { name: "announcement_text_search" });

export const Announcement = model<IAnnouncement>("Announcement", announcementSchema);
