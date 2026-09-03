import { Schema, model, Document, Types } from "mongoose";
import { bilingualField, publishFields, geoField, mediaItemSchema } from "@/common/schemaHelpers";

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: { en: string; te: string };
  description: { en: string; te: string };
  date: Date;
  startTime?: string;
  endTime?: string;
  location: { en: string; te: string };
  address: { en: string; te: string };
  geo: { lat: number | null; lng: number | null };
  media: Array<{ url: string; thumbnailUrl?: string; mediumUrl?: string; type: string; caption_en: string; caption_te: string }>;
  registrationInfo?: { en: string; te: string };
  status: string;
  publishAt: Date | null;
  expiresAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: bilingualField(),
    description: bilingualField(),
    date: { type: Date, required: true, index: true },
    startTime: { type: String },
    endTime: { type: String },
    location: bilingualField(),
    address: bilingualField(false),
    geo: geoField,
    media: [mediaItemSchema],
    registrationInfo: { en: { type: String, default: "" }, te: { type: String, default: "" } },
    ...publishFields,
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index(
  { "title.en": "text", "title.te": "text", "description.en": "text", "description.te": "text" },
  { name: "event_text_search" }
);

export const Event = model<IEvent>("Event", eventSchema);
