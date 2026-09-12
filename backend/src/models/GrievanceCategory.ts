import { Schema, model, Document, Types } from "mongoose";
import { bilingualField } from "@/common/schemaHelpers";

// A two-level taxonomy (category -> subcategories). Subcategories are
// embedded rather than a separate collection since they only ever need to
// be listed/edited alongside their parent, never queried independently —
// but the whole thing lives in the database (seeded via
// scripts/seedGrievanceConfig.ts) rather than a hardcoded frontend enum,
// so an admin can add a subcategory later without a code change.
export interface IGrievanceSubCategory {
  name: { en: string; te: string };
  slug: string;
}

export interface IGrievanceCategory extends Document {
  _id: Types.ObjectId;
  name: { en: string; te: string };
  slug: string;
  isOther: boolean;
  subCategories: IGrievanceSubCategory[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const subCategorySchema = new Schema<IGrievanceSubCategory>(
  {
    name: bilingualField(),
    slug: { type: String, required: true },
  },
  { _id: false }
);

const grievanceCategorySchema = new Schema<IGrievanceCategory>(
  {
    name: bilingualField(),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // The "Others" category allows a free-text note instead of a fixed
    // subcategory — flagged here so the API/UI know to accept
    // customCategoryNote instead of requiring a subCategory slug.
    isOther: { type: Boolean, default: false },
    subCategories: [subCategorySchema],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GrievanceCategory = model<IGrievanceCategory>("GrievanceCategory", grievanceCategorySchema);
