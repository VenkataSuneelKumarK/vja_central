import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ContentStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ContentTable } from "./ContentTable";
import { useAuth } from "@/context/AuthContext";
import { canDelete as checkCanDelete, canPublish as checkCanPublish, canWrite } from "@/utils/permissions";
import { apiErrorMessage } from "@/api/client";

interface ResourceHooks<T> {
  useList: (params: Record<string, unknown>) => {
    data: { items: T[]; page: number; limit: number; total: number; hasMore: boolean } | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };
  useUpdateStatus: () => { mutateAsync: (v: { id: string; status: string }) => Promise<unknown> };
  useDelete: () => { mutateAsync: (id: string) => Promise<unknown> };
}

const STATUS_FILTERS: Array<{ value: ContentStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function ContentListPage<T extends { _id: string; status: ContentStatus }>({
  title,
  resource,
  columns,
  newHref,
  editHrefFor,
  extraFilters,
}: {
  title: string;
  resource: ResourceHooks<T>;
  columns: Array<{ header: string; render: (item: T) => ReactNode; className?: string }>;
  newHref: string;
  editHrefFor: (item: T) => string;
  extraFilters?: ReactNode;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);

  const { data, isLoading, isError, refetch } = resource.useList({ page, limit: 20, ...(status ? { status } : {}) });
  const updateStatus = resource.useUpdateStatus();
  const del = resource.useDelete();

  async function handlePublishToggle(item: T) {
    try {
      await updateStatus.mutateAsync({ id: item._id, status: item.status === "published" ? "archived" : "published" });
      toast.success(item.status === "published" ? "Unpublished" : "Published");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await del.mutateAsync(pendingDelete._id);
      toast.success("Deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {canWrite(user?.role) && <Button onClick={() => navigate(newHref)}>+ New</Button>}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-2 shadow-soft backdrop-blur-sm">
        <span className="flex items-center gap-1.5 pl-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16M7 12h10M10 19h4" />
          </svg>
          Filter
        </span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ContentStatus | "");
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-shadow hover:shadow-md"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        {extraFilters}
      </div>

      {isLoading && <SkeletonRows />}
      {isError && <ErrorState message="Couldn't load this list." onRetry={() => refetch()} />}
      {data && data.items.length === 0 && <EmptyState title={`No ${title.toLowerCase()} yet`} hint="Click “+ New” to create one." />}

      {data && data.items.length > 0 && (
        <>
          <ContentTable
            items={data.items}
            columns={columns}
            onEdit={(item) => navigate(editHrefFor(item))}
            onPublishToggle={checkCanPublish(user?.role) ? handlePublishToggle : undefined}
            onDelete={checkCanDelete(user?.role) ? (item) => setPendingDelete(item) : undefined}
            canPublish={checkCanPublish(user?.role)}
            canDelete={checkCanDelete(user?.role)}
          />
          <Pagination page={data.page} hasMore={data.hasMore} total={data.total} limit={data.limit} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this item?"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
