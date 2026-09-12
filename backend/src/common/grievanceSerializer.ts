import { IGrievance } from "@/models/Grievance";
import { getSlaState } from "@/common/sla";

// Attaches a computed slaState ("on_track"|"due_soon"|"overdue"|null) to a
// grievance response — computed fresh on every read rather than stored, so
// it's always accurate to "now" without a background job keeping it in sync.
export function withSlaState<T extends Pick<IGrievance, "dueDate" | "status">>(grievance: T) {
  const plain = typeof (grievance as unknown as { toObject?: () => object }).toObject === "function" ? (grievance as unknown as { toObject: () => object }).toObject() : grievance;
  return { ...plain, slaState: getSlaState(grievance.dueDate, grievance.status) };
}

export function withSlaStateList<T extends Pick<IGrievance, "dueDate" | "status">>(grievances: T[]) {
  return grievances.map(withSlaState);
}
