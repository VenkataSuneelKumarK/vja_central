import { ReactNode } from "react";
import { ContentStatus } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

// The list-table shape (title/status/date + edit/publish/delete actions) is
// identical across Activities, Events, News, Videos and Announcements — one
// generic table keeps that behavior consistent instead of six near-copies.
export function ContentTable<T extends { _id: string; status: ContentStatus }>({
  items,
  columns,
  onEdit,
  onPublishToggle,
  onDelete,
  canPublish,
  canDelete,
}: {
  items: T[];
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onPublishToggle?: (item: T) => void;
  onDelete?: (item: T) => void;
  canPublish: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/90 shadow-soft backdrop-blur-sm">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-gradient-to-r from-slate-100 via-slate-100/80 to-slate-100">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className="border-b-2 border-slate-200 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                {c.header}
              </th>
            ))}
            <th className="border-b-2 border-slate-200 px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item._id} className="transition-colors hover:bg-brand-50/50">
              {columns.map((c) => (
                <td key={c.header} className={`px-4 py-3 ${c.className ?? ""}`}>
                  {c.render(item)}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => onEdit(item)}>
                    Edit
                  </Button>
                  {canPublish && onPublishToggle && (
                    <Button variant="secondary" onClick={() => onPublishToggle(item)}>
                      {item.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                  )}
                  {canDelete && onDelete && (
                    <Button variant="danger" onClick={() => onDelete(item)}>
                      Delete
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusCell({ status }: { status: ContentStatus }) {
  return <StatusBadge status={status} />;
}
