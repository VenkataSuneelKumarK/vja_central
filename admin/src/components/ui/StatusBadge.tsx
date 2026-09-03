import { ContentStatus } from "@/types";

const styles: Record<ContentStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-200 text-slate-500",
};

const labels: Record<ContentStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
}
