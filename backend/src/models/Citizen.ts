import { Schema, model, Document, Types } from "mongoose";

// Deliberately a separate collection/model from the admin User model
// (backend/src/models/User.ts) — a citizen and a staff member must never
// be able to authenticate as each other, so keeping the schemas and the
// JWT signing (see middleware/citizenAuth.ts) fully independent means
// there's no shared secret or payload shape that could let one type of
// token accidentally satisfy the other's middleware.
export interface ICitizen extends Document {
  _id: Types.ObjectId;
  username: string;
  mobile: string;
  fullName?: string;
  passwordHash: string;
  isActive: boolean;
  pushTopicSubscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const citizenSchema = new Schema<ICitizen>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    // Set true once the client confirms it subscribed this citizen's device
    // to their personal FCM topic (citizen_<id>) — informational only, the
    // subscription itself lives client-side with Firebase, not here.
    pushTopicSubscribed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Citizen = model<ICitizen>("Citizen", citizenSchema);
