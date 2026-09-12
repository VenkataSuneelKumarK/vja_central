import { Counter } from "@/models/Counter";

// MV-YYYY-NNNNNN, atomically generated. findOneAndUpdate's $inc is a single
// atomic operation at the MongoDB document level — two requests arriving at
// the same instant still each get a unique, gapless-per-success seq value
// (no read-modify-write race, no need for an application-level lock).
export async function nextGrievanceNumber(year: number): Promise<{ grievanceNumber: string; sequenceNumber: number }> {
  const key = `grievance_${year}`;
  const counter = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  const sequenceNumber = counter.seq;
  const grievanceNumber = `MV-${year}-${String(sequenceNumber).padStart(6, "0")}`;
  return { grievanceNumber, sequenceNumber };
}
