import { Schema, model, Document, Types } from "mongoose";
import { bilingualField } from "@/common/schemaHelpers";
import { CONTENT_TYPES } from "@/common/constants";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: { en: string; te: string };
  slug: string;
  appliesTo: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: bilingualField(),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    appliesTo: [{ type: String, enum: CONTENT_TYPES }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>("Category", categorySchema);
