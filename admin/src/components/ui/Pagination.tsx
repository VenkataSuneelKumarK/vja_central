import { Button } from "./Button";

export function Pagination({
  page,
  hasMore,
  onChange,
  total,
  limit,
}: {
  page: number;
  hasMore: boolean;
  onChange: (page: number) => void;
  total: number;
  limit: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-500 shadow-soft backdrop-blur-sm">
      <span>
        Page <span className="font-semibold text-slate-700">{page}</span> of {totalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={!hasMore} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
