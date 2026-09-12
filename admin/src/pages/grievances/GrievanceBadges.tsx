import { GrievancePriority, GrievanceStatus, SlaState } from "@/types/grievance";

const statusStyles: Record<GrievanceStatus, string> = {
  open: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  assigned: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  in_progress: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  resolved: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  verified: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  reopened: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  closed: "bg-slate-200/70 text-slate-600 ring-1 ring-slate-200",
  rejected: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

const statusLabels: Record<GrievanceStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  verified: "Verified",
  reopened: "Reopened",
  closed: "Closed",
  rejected: "Rejected",
};

export function GrievanceStatusBadge({ status }: { status: GrievanceStatus }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}

const priorityEmoji: Record<GrievancePriority, string> = {
  emergency: "🔴",
  high: "🟠",
  normal: "🟡",
  suggestion: "🟢",
};

const priorityLabels: Record<GrievancePriority, string> = {
  emergency: "Emergency",
  high: "High",
  normal: "Normal",
  suggestion: "Suggestion",
};

export function GrievancePriorityBadge({ priority }: { priority: GrievancePriority }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
      {priorityEmoji[priority]} {priorityLabels[priority]}
    </span>
  );
}

const slaStyles: Record<NonNullable<SlaState>, string> = {
  on_track: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  due_soon: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  overdue: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

const slaLabels: Record<NonNullable<SlaState>, string> = {
  on_track: "On Time",
  due_soon: "Due Soon",
  overdue: "Overdue",
};

export function SlaBadge({ sla }: { sla: SlaState }) {
  if (!sla) return <span className="text-xs text-slate-400">—</span>;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${slaStyles[sla]}`}>{slaLabels[sla]}</span>;
}
