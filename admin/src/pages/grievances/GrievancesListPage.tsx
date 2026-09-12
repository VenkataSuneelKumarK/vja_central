import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonRows, EmptyState, ErrorState } from "@/components/ui/States";
import { FloatingInput, FloatingSelect } from "@/components/ui/FloatingField";
import {
  useGrievancesList,
  useGrievanceDashboard,
  useGrievanceCategoriesAdmin,
  useDepartments,
  useOfficers,
} from "@/api/grievances";
import { GrievancePriorityBadge, GrievanceStatusBadge, SlaBadge } from "./GrievanceBadges";
import { GrievanceCategoryRef, GrievanceStatus } from "@/types/grievance";

const STATUS_OPTIONS: GrievanceStatus[] = ["open", "assigned", "in_progress", "resolved", "verified", "reopened", "closed", "rejected"];

interface Filters {
  status: string;
  priority: string;
  category: string;
  subCategory: string;
  ward: string;
  area: string;
  department: string;
  assignedOfficer: string;
  from: string;
  to: string;
  q: string;
}

const EMPTY_FILTERS: Filters = {
  status: "",
  priority: "",
  category: "",
  subCategory: "",
  ward: "",
  area: "",
  department: "",
  assignedOfficer: "",
  from: "",
  to: "",
  q: "",
};

export function GrievancesListPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const { data: categories } = useGrievanceCategoriesAdmin();
  const { data: departments } = useDepartments();
  const { data: officers } = useOfficers(filters.department || undefined);

  const apiParams = Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string>;

  const { data, isLoading, isError, refetch } = useGrievancesList({ ...apiParams, page, limit: 20 });
  const { data: dashboard } = useGrievanceDashboard(apiParams);

  const selectedCategory = categories?.find((c) => c._id === filters.category);

  function updateFilter<K extends keyof Filters>(key: K, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value, ...(key === "category" ? { subCategory: "" } : {}), ...(key === "department" ? { assignedOfficer: "" } : {}) }));
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Grievances</h1>
        <p className="text-sm text-slate-400">Praja Samvad — public grievance tracking and resolution.</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total" value={dashboard.total} />
          <KpiCard label="Pending" value={dashboard.pending} accent="amber" />
          <KpiCard label="Overdue" value={dashboard.overdue} accent="red" />
          <KpiCard label="Resolved" value={dashboard.resolved} accent="emerald" />
          <KpiCard label="Resolution Rate" value={`${dashboard.resolutionRate}%`} accent="brand" />
        </div>
      )}

      {dashboard && dashboard.priorityBreakdown.emergency > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800">
          🔴 {dashboard.priorityBreakdown.emergency} Emergency grievance{dashboard.priorityBreakdown.emergency === 1 ? "" : "s"} pending attention
        </div>
      )}

      <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
        <FloatingSelect label="Status" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect label="Priority" value={filters.priority} onChange={(e) => updateFilter("priority", e.target.value)}>
          <option value="">All priorities</option>
          <option value="emergency">Emergency</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="suggestion">Suggestion</option>
        </FloatingSelect>
        <FloatingSelect label="Category" value={filters.category} onChange={(e) => updateFilter("category", e.target.value)}>
          <option value="">All categories</option>
          {categories?.map((c: GrievanceCategoryRef) => (
            <option key={c._id} value={c._id}>
              {c.name.en}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect label="Sub-category" value={filters.subCategory} onChange={(e) => updateFilter("subCategory", e.target.value)} disabled={!selectedCategory}>
          <option value="">All sub-categories</option>
          {selectedCategory?.subCategories.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name.en}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect label="Department" value={filters.department} onChange={(e) => updateFilter("department", e.target.value)}>
          <option value="">All departments</option>
          {departments?.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name.en}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect label="Officer" value={filters.assignedOfficer} onChange={(e) => updateFilter("assignedOfficer", e.target.value)}>
          <option value="">All officers</option>
          {officers?.map((o) => (
            <option key={o._id} value={o._id}>
              {o.name}
            </option>
          ))}
        </FloatingSelect>
        <FloatingInput label="Ward" value={filters.ward} onChange={(e) => updateFilter("ward", e.target.value)} />
        <FloatingInput label="Area" value={filters.area} onChange={(e) => updateFilter("area", e.target.value)} />
        <FloatingInput label="From" type="date" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} />
        <FloatingInput label="To" type="date" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} />
        <FloatingInput
          label="Search (ID, name, mobile, heading)"
          value={filters.q}
          onChange={(e) => updateFilter("q", e.target.value)}
          wrapperClassName="col-span-2 sm:col-span-1"
        />
      </Card>

      {isLoading && <SkeletonRows rows={8} />}
      {isError && <ErrorState message="Couldn't load grievances." onRetry={() => refetch()} />}
      {data && data.items.length === 0 && <EmptyState title="No grievances match these filters" />}

      {data && data.items.length > 0 && (
        <>
          <Card className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-gradient-to-r from-slate-100 via-slate-100/80 to-slate-100">
                <tr>
                  {["ID", "Heading", "Citizen", "Mobile", "Category", "Sub-category", "Area", "Ward", "Priority", "Status", "Department", "Officer", "Due Date", "Submitted", "Updated"].map((h) => (
                    <th key={h} className="whitespace-nowrap border-b-2 border-slate-200 px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((g) => {
                  const categoryName = typeof g.category === "object" ? g.category.name.en : "";
                  const departmentName = g.department && typeof g.department === "object" ? g.department.name.en : "—";
                  const officerName = g.assignedOfficer && typeof g.assignedOfficer === "object" ? g.assignedOfficer.name : g.assignedOfficerName || "—";
                  return (
                    <tr key={g._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <Link to={`/grievances/${g._id}`} className="font-semibold text-brand-600 hover:underline">
                          {g.grievanceNumber}
                        </Link>
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-700" title={g.heading}>
                        {g.heading}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{g.citizenName}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{g.citizenMobile}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{categoryName}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{g.subCategory || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{g.area || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{g.ward || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <GrievancePriorityBadge priority={g.priority} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <GrievanceStatusBadge status={g.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{departmentName}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{officerName}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-600">{g.dueDate ? new Date(g.dueDate).toLocaleDateString() : "—"}</span>
                          <SlaBadge sla={g.slaState} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{new Date(g.createdAt).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{new Date(g.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          <Pagination page={data.page} hasMore={data.hasMore} total={data.total} limit={data.limit} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, accent = "slate" }: { label: string; value: string | number; accent?: "slate" | "amber" | "red" | "emerald" | "brand" }) {
  const accentText: Record<string, string> = {
    slate: "text-slate-900",
    amber: "text-amber-600",
    red: "text-red-600",
    emerald: "text-emerald-600",
    brand: "text-brand-600",
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentText[accent]}`}>{value}</p>
    </Card>
  );
}
