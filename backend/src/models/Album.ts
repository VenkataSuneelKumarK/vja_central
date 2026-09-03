import { Schema, model, Document, Types } from "mongoose";
import { bilingualField, publishFields } from "@/common/schemaHelpers";

export interface IAlbum extends Document {
  _id: Types.ObjectId;
  title: { en: string; te: string };
  description: { en: string; te: string };
  date?: Date;
  location: { en: string; te: string };
  coverImage?: string;
  status: string;
  publishAt: Date | null;
  expiresAt: Date | null;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const albumSchema = new Schema<IAlbum>(
  {
    title: bilingualField(),
    description: bilingualField(false),
    date: { type: Date },
    location: bilingualField(false),
    coverImage: { type: String },
    ...publishFields,
  },
  { timestamps: true }
);

albumSchema.index({ status: 1, publishAt: -1 });
albumSchema.index({ "title.en": "text", "title.te": "text", "description.en": "text" }, { name: "album_text_search" });

export const Album = model<IAlbum>("Album", albumSchema);
