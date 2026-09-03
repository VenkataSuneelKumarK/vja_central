import { Schema, model, Document, Types } from "mongoose";
import { bilingualField, publishFields, geoField, mediaItemSchema } from "@/common/schemaHelpers";

export interface IActivity extends Document {
  _id: Types.ObjectId;
  title: { en: string; te: string };
  description: { en: string; te: string };
  date: Date;
  time?: string;
  location: { en: string; te: string };
  geo: { lat: number | null; lng: number | null };
  category: Types.ObjectId | null;
  coverImage?: string;
  media: Array<{ url: string; thumbnailUrl?: string; mediumUrl?: string; type: string; caption_en: string; caption_te: string }>;
  externalLinks: string[];
  peopleInvolved: string[];
  status: string;
  publishAt: Date | null;
  expiresAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    title: bilingualField(),
    description: bilingualField(),
    date: { type: Date, required: true, index: true },
    time: { type: String },
    location: bilingualField(),
    geo: geoField,
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    coverImage: { type: String },
    media: [mediaItemSchema],
    externalLinks: [{ type: String }],
    peopleInvolved: [{ type: String }],
    ...publishFields,
  },
  { timestamps: true }
);

activitySchema.index({ status: 1, publishAt: -1 });
activitySchema.index({ status: 1, date: -1 });
activitySchema.index(
  { "title.en": "text", "title.te": "text", "description.en": "text", "description.te": "text" },
  { name: "activity_text_search" }
);

export const Activity = model<IActivity>("Activity", activitySchema);
