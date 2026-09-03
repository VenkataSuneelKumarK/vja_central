import { Schema, model, Document, Types } from "mongoose";
import { bilingualField, publishFields } from "@/common/schemaHelpers";

export interface INews extends Document {
  _id: Types.ObjectId;
  title: { en: string; te: string };
  summary: { en: string; te: string };
  content: { en: string; te: string };
  coverImage?: string;
  category: Types.ObjectId | null;
  author?: string;
  sourceUrl?: string;
  status: string;
  publishAt: Date | null;
  expiresAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: bilingualField(),
    summary: bilingualField(),
    content: bilingualField(),
    coverImage: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    author: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    ...publishFields,
  },
  { timestamps: true }
);

newsSchema.index({ status: 1, publishAt: -1 });
newsSchema.index(
  { "title.en": "text", "title.te": "text", "summary.en": "text", "content.en": "text" },
  { name: "news_text_search" }
);

export const News = model<INews>("News", newsSchema);
