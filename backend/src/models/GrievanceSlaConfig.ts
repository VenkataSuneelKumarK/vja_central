import { Schema, model, Document } from "mongoose";

// A singleton document (same pattern as AppSettings) so SLA hours-per-
// priority are admin-configurable rather than hard-coded (§21 of the
// spec explicitly requires this). dueDate is computed from these values
// at grievance-creation time — see common/sla.ts.
export interface IGrievanceSlaConfig extends Document<string> {
  _id: string;
  emergencyHours: number;
  highHours: number;
  normalHours: number;
  suggestionHours: number;
  updatedAt: Date;
}

const grievanceSlaConfigSchema = new Schema<IGrievanceSlaConfig>(
  {
    _id: { type: String, default: "grievance_sla_config" },
    emergencyHours: { type: Number, default: 24 },
    highHours: { type: Number, default: 72 }, // 3 days
    normalHours: { type: Number, default: 168 }, // 7 days
    suggestionHours: { type: Number, default: 336 }, // 14 days
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const GrievanceSlaConfig = model<IGrievanceSlaConfig>("GrievanceSlaConfig", grievanceSlaConfigSchema);
