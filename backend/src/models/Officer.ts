import { Schema, model, Document, Types } from "mongoose";

export interface IOfficer extends Document {
  _id: Types.ObjectId;
  name: string;
  mobile?: string;
  department: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const officerSchema = new Schema<IOfficer>(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Officer = model<IOfficer>("Officer", officerSchema);
