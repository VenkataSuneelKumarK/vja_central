import { ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canManageGrievances } from "@/utils/permissions";
import { useGrievanceDetail, useGrievanceTimeline } from "@/api/grievances";
import { Card } from "@/components/ui/Card";
import { ErrorState, SkeletonRows } from "@/components/ui/States";
import { GrievancePriorityBadge, GrievanceStatusBadge, SlaBadge } from "./GrievanceBadges";
import { AssignmentPanel, PriorityPanel, StatusPanel, CommentPanel } from "./GrievanceActionPanels";

export function GrievanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canManage = canManageGrievances(user?.role);

  const { data: grievance, isLoading, isError, refetch } = useGrievanceDetail(id);
  const { data: timeline } = useGrievanceTimeline(id);

  if (isLoading) return <SkeletonRows rows={6} />;
  if (isError || !grievance) return <ErrorState message="Couldn't load this grievance." onRetry={() => refetch()} />;

  const categoryName = typeof grievance.category === "object" ? grievance.category.name.en : "";
  const departmentName = grievance.department && typeof grievance.department === "object" ? grievance.department.name.en : null;
  const officerName = grievance.assignedOfficer && typeof grievance.assignedOfficer === "object" ? grievance.assignedOfficer.name : grievance.assignedOfficerName;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/grievances" className="text-xs font-medium text-brand-600 hover:underline">
            ← Back to Grievances
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{grievance.grievanceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <GrievanceStatusBadge status={grievance.status} />
          <SlaBadge sla={grievance.slaState} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="space-y-3 p-5">
            <h2 className="text-lg font-semibold text-slate-900">{grievance.heading}</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-600">{grievance.description}</p>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm sm:grid-cols-3">
              <Field label="Category" value={`${categoryName}${grievance.subCategory ? ` · ${grievance.subCategory}` : ""}`} />
              {grievance.customCategoryNote && <Field label="Details" value={grievance.customCategoryNote} />}
              <Field label="Priority" value={<GrievancePriorityBadge priority={grievance.priority} />} />
              <Field label="Area" value={grievance.area || "—"} />
              <Field label="Ward" value={grievance.ward || "—"} />
              <Field label="Landmark" value={grievance.landmark || "—"} />
              <Field label="Department" value={departmentName || "Unassigned"} />
              <Field label="Officer" value={officerName || "Unassigned"} />
              <Field label="Due Date" value={grievance.dueDate ? new Date(grievance.dueDate).toLocaleDateString() : "—"} />
              <Field label="Submitted" value={new Date(grievance.createdAt).toLocaleString()} />
              <Field label="Last Updated" value={new Date(grievance.updatedAt).toLocaleString()} />
            </div>

            {grievance.attachments.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {grievance.attachments.map((a) => (
                    <a key={a.url} href={a.url} target="_blank" rel="noreferrer">
                      <img src={a.thumbnailUrl ?? a.url} alt={a.fileName} className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-2 p-5">
            <h3 className="text-sm font-semibold text-slate-800">Citizen</h3>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Field label="Name" value={grievance.citizenName} />
              <Field label="Mobile" value={grievance.citizenMobile} />
            </div>
          </Card>

          {(grievance.resolutionDescription || grievance.rejectionReason || grievance.reopenReason) && (
            <Card className="space-y-2 p-5">
              <h3 className="text-sm font-semibold text-slate-800">Resolution</h3>
              {grievance.resolutionDescription && <p className="text-sm text-slate-600">{grievance.resolutionDescription}</p>}
              {grievance.rejectionReason && <p className="text-sm text-red-600">Rejected: {grievance.rejectionReason}</p>}
              {grievance.reopenReason && <p className="text-sm text-amber-700">Reopened ({grievance.reopenCount}x): {grievance.reopenReason}</p>}
              {grievance.citizenRating && (
                <p className="text-sm text-slate-600">
                  Citizen rating: {"★".repeat(grievance.citizenRating)}
                  {"☆".repeat(5 - grievance.citizenRating)}
                  {grievance.citizenFeedback ? ` — ${grievance.citizenFeedback}` : ""}
                </p>
              )}
            </Card>
          )}

          <Card className="space-y-3 p-5">
            <h3 className="text-sm font-semibold text-slate-800">Timeline</h3>
            <div className="space-y-3">
              {timeline?.map((entry) => (
                <div key={entry._id} className="flex gap-3 border-l-2 border-slate-200 pl-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{entry.actorName}</span>
                      {!entry.isPublic && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">Internal</span>}
                    </div>
                    <p className="text-sm text-slate-600">{entry.message}</p>
                    <p className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {timeline?.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
            </div>
          </Card>
        </div>

        {canManage ? (
          <div className="space-y-5">
            <AssignmentPanel grievance={grievance} />
            <PriorityPanel grievance={grievance} />
            <StatusPanel grievance={grievance} />
            <CommentPanel grievanceId={grievance._id} />
          </div>
        ) : (
          <Card className="p-5 text-sm text-slate-500">You have view-only access to grievances.</Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-700">{value}</p>
    </div>
  );
}
