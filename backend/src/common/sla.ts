import { GrievanceSlaConfig } from "@/models/GrievanceSlaConfig";
import { GrievancePriority } from "@/common/constants";

const SLA_CONFIG_ID = "grievance_sla_config";

export async function getGrievanceSlaConfig() {
  const existing = await GrievanceSlaConfig.findById(SLA_CONFIG_ID);
  if (existing) return existing;
  return GrievanceSlaConfig.create({ _id: SLA_CONFIG_ID });
}

// dueDate = createdAt + SLA hours for the (current) priority. Called at
// creation time and again whenever an admin changes priority (unless the
// due date was manually overridden, in which case it's left alone —
// §21: "Admin/Super Admin can override the deadline if required").
export async function computeDueDate(priority: GrievancePriority, from: Date): Promise<Date> {
  const config = await getGrievanceSlaConfig();
  const hoursByPriority: Record<GrievancePriority, number> = {
    emergency: config.emergencyHours,
    high: config.highHours,
    normal: config.normalHours,
    suggestion: config.suggestionHours,
  };
  const hours = hoursByPriority[priority];
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

export type SlaState = "on_track" | "due_soon" | "overdue";

const DUE_SOON_WINDOW_HOURS = 24;

// §22: On Time / Due Soon / Overdue. A closed/resolved/verified/rejected
// grievance is never "overdue" regardless of its dueDate — SLA only
// applies while a grievance is still actively pending.
export function getSlaState(dueDate: Date | null, status: string, now: Date = new Date()): SlaState | null {
  if (!dueDate) return null;
  const isActive = !["resolved", "verified", "closed", "rejected"].includes(status);
  if (!isActive) return null;
  if (now > dueDate) return "overdue";
  const hoursRemaining = (dueDate.getTime() - now.getTime()) / (60 * 60 * 1000);
  if (hoursRemaining <= DUE_SOON_WINDOW_HOURS) return "due_soon";
  return "on_track";
}
