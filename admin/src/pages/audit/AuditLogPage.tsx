import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Paginated } from "@/api/client";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonRows } from "@/components/ui/States";

interface AuditLogEntry {
  _id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", page],
    queryFn: async () => (await api.get<{ data: Paginated<AuditLogEntry> }>("/admin/audit-log", { params: { page, limit: 25 } })).data.data,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
      <p className="text-sm text-slate-400">Every administrative create, update, delete, publish and status change is recorded here (§15 of the brief).</p>

      {isLoading && <SkeletonRows />}

      {data && (
        <>
          <Card className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-slate-500">When</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-slate-500">Actor</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-slate-500">Action</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-slate-500">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-4 py-2.5 text-slate-500">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-slate-700">{entry.actorEmail}</td>
                    <td className="px-4 py-2.5 text-slate-700">{entry.action}</td>
                    <td className="px-4 py-2.5 text-slate-500">{entry.entityType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={data.page} hasMore={data.hasMore} total={data.total} limit={data.limit} onChange={setPage} />
        </>
      )}
    </div>
  );
}
