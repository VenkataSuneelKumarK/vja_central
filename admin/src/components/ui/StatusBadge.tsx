import { ContentStatus } from "@/types";

const styles: Record<ContentStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  scheduled: "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 ring-1 ring-amber-200",
  published: "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  archived: "bg-slate-200/70 text-slate-500 ring-1 ring-slate-200",
};

const dotStyles: Record<ContentStatus, string> = {
  draft: "bg-slate-400",
  scheduled: "bg-amber-500",
  published: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]",
  archived: "bg-slate-400",
};

const labels: Record<ContentStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {labels[status]}
    </span>
  );
}
