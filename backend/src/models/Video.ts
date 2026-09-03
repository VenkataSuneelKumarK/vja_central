import { Schema, model, Document, Types } from "mongoose";
import { bilingualField, publishFields } from "@/common/schemaHelpers";

export interface IVideo extends Document {
  _id: Types.ObjectId;
  title: { en: string; te: string };
  description: { en: string; te: string };
  thumbnailUrl?: string;
  source: "youtube" | "hosted";
  videoUrl?: string;
  youtubeId?: string;
  category: Types.ObjectId | null;
  status: string;
  publishAt: Date | null;
  expiresAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    title: bilingualField(),
    description: bilingualField(false),
    thumbnailUrl: { type: String },
    source: { type: String, enum: ["youtube", "hosted"], required: true },
    videoUrl: { type: String },
    youtubeId: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    ...publishFields,
  },
  { timestamps: true }
);

videoSchema.index({ status: 1, publishAt: -1 });
videoSchema.index({ "title.en": "text", "title.te": "text", "description.en": "text" }, { name: "video_text_search" });

export const Video = model<IVideo>("Video", videoSchema);
