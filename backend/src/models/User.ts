import { Schema, model, Document, Types } from "mongoose";
import { ROLES, Role } from "@/common/constants";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "viewer" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
