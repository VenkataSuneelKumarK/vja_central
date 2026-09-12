import { Schema, model, Document } from "mongoose";

// A generic atomic counter — _id is a namespaced key (e.g. "grievance_2026")
// so the sequence naturally resets per year without any date math beyond
// picking the key. MongoDB's findOneAndUpdate with $inc is atomic at the
// document level, so concurrent requests can never receive the same seq
// value even under heavy simultaneous submission — see
// common/sequence.ts for the actual increment call.
export interface ICounter extends Document<string> {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = model<ICounter>("Counter", counterSchema);
