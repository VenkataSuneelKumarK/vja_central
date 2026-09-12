import { Schema, model, Document, Types } from "mongoose";
import { bilingualField } from "@/common/schemaHelpers";

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  name: { en: string; te: string };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: bilingualField(),
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Department = model<IDepartment>("Department", departmentSchema);
