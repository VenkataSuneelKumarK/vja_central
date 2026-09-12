import { useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingSelect, FloatingTextarea } from "@/components/ui/FloatingField";
import { apiErrorMessage } from "@/api/client";
import {
  useAssignGrievance,
  useChangeGrievancePriority,
  useChangeGrievanceStatus,
  useResolveGrievance,
  useRejectGrievance,
  useAddGrievanceComment,
  useDepartments,
  useOfficers,
} from "@/api/grievances";
import { Grievance, GrievancePriority, GrievanceStatus } from "@/types/grievance";

const ALLOWED_STATUS_TRANSITIONS: GrievanceStatus[] = ["open", "assigned", "in_progress", "reopened"];

export function AssignmentPanel({ grievance }: { grievance: Grievance }) {
  const { data: departments } = useDepartments();
  const currentDeptId = typeof grievance.department === "object" ? grievance.department?._id : grievance.department ?? "";
  const [department, setDepartment] = useState(currentDeptId || "");
  const { data: officers } = useOfficers(department || undefined);
  const currentOfficerId = typeof grievance.assignedOfficer === "object" ? grievance.assignedOfficer?._id : grievance.assignedOfficer ?? "";
  const [assignedOfficer, setAssignedOfficer] = useState(currentOfficerId || "");
  const [dueDate, setDueDate] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const assign = useAssignGrievance(grievance._id);

  function onSubmit() {
    if (!department) {
      toast.error("Select a department");
      return;
    }
    assign.mutate(
      { department, assignedOfficer: assignedOfficer || undefined, dueDate: dueDate || undefined, internalNote: internalNote || undefined },
      {
        onSuccess: () => {
          toast.success("Grievance assigned");
          setInternalNote("");
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      }
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-slate-800">Assignment</h3>
      <FloatingSelect label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
        <option value="">Select department</option>
        {departments?.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name.en}
          </option>
        ))}
      </FloatingSelect>
      <FloatingSelect label="Officer (optional)" value={assignedOfficer} onChange={(e) => setAssignedOfficer(e.target.value)} disabled={!department}>
        <option value="">Unassigned</option>
        {officers?.map((o) => (
          <option key={o._id} value={o._id}>
            {o.name}
          </option>
        ))}
      </FloatingSelect>
      <FloatingInput label="Due Date override (optional)" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <FloatingTextarea label="Internal note (optional)" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} />
      <Button onClick={onSubmit} disabled={assign.isPending} className="w-full">
        {assign.isPending ? "Saving…" : "Assign"}
      </Button>
    </Card>
  );
}

export function PriorityPanel({ grievance }: { grievance: Grievance }) {
  const [priority, setPriority] = useState<GrievancePriority>(grievance.priority);
  const [reason, setReason] = useState("");
  const changePriority = useChangeGrievancePriority(grievance._id);

  function onSubmit() {
    if (reason.trim().length < 5) {
      toast.error("A reason (at least 5 characters) is required to change priority");
      return;
    }
    changePriority.mutate(
      { priority, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Priority updated");
          setReason("");
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      }
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-slate-800">Priority</h3>
      <p className="text-xs text-slate-400">
        Submitted as <span className="font-medium text-slate-600">{grievance.initialPriority}</span>
        {grievance.priorityChangeReason ? ` · last change: ${grievance.priorityChangeReason}` : ""}
      </p>
      <FloatingSelect label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as GrievancePriority)}>
        <option value="emergency">Emergency</option>
        <option value="high">High</option>
        <option value="normal">Normal</option>
        <option value="suggestion">Suggestion</option>
      </FloatingSelect>
      <FloatingTextarea label="Reason for change" required value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
      <Button onClick={onSubmit} disabled={changePriority.isPending} className="w-full">
        {changePriority.isPending ? "Saving…" : "Update Priority"}
      </Button>
    </Card>
  );
}

export function StatusPanel({ grievance }: { grievance: Grievance }) {
  const [status, setStatus] = useState<GrievanceStatus>(ALLOWED_STATUS_TRANSITIONS.includes(grievance.status) ? grievance.status : "in_progress");
  const [note, setNote] = useState("");
  const [resolutionDescription, setResolutionDescription] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [mode, setMode] = useState<"status" | "resolve" | "reject">("status");

  const changeStatus = useChangeGrievanceStatus(grievance._id);
  const resolve = useResolveGrievance(grievance._id);
  const reject = useRejectGrievance(grievance._id);

  const isFinal = ["resolved", "verified", "closed", "rejected"].includes(grievance.status);

  if (isFinal) {
    return (
      <Card className="space-y-1 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Status</h3>
        <p className="text-sm text-slate-500">This grievance is {grievance.status.replace(/_/g, " ")} and no longer accepts status changes here.</p>
        {grievance.resolutionDescription && <p className="text-xs text-slate-400">Resolution: {grievance.resolutionDescription}</p>}
        {grievance.rejectionReason && <p className="text-xs text-slate-400">Rejection reason: {grievance.rejectionReason}</p>}
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-slate-800">Status</h3>
      <div className="flex gap-2 text-xs">
        <button onClick={() => setMode("status")} className={`rounded-full px-3 py-1 font-medium ${mode === "status" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
          Change Status
        </button>
        <button onClick={() => setMode("resolve")} className={`rounded-full px-3 py-1 font-medium ${mode === "resolve" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          Resolve
        </button>
        <button onClick={() => setMode("reject")} className={`rounded-full px-3 py-1 font-medium ${mode === "reject" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>
          Reject
        </button>
      </div>

      {mode === "status" && (
        <>
          <FloatingSelect label="New status" value={status} onChange={(e) => setStatus(e.target.value as GrievanceStatus)}>
            {ALLOWED_STATUS_TRANSITIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </FloatingSelect>
          <FloatingTextarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          <Button
            className="w-full"
            disabled={changeStatus.isPending}
            onClick={() =>
              changeStatus.mutate(
                { status, note: note || undefined },
                { onSuccess: () => { toast.success("Status updated"); setNote(""); }, onError: (err) => toast.error(apiErrorMessage(err)) }
              )
            }
          >
            {changeStatus.isPending ? "Saving…" : "Update Status"}
          </Button>
        </>
      )}

      {mode === "resolve" && (
        <>
          <FloatingTextarea label="Resolution description" required value={resolutionDescription} onChange={(e) => setResolutionDescription(e.target.value)} rows={3} />
          <Button
            className="w-full"
            disabled={resolve.isPending}
            onClick={() => {
              if (resolutionDescription.trim().length < 10) {
                toast.error("Describe how the issue was resolved (at least 10 characters)");
                return;
              }
              resolve.mutate(
                { resolutionDescription: resolutionDescription.trim() },
                { onSuccess: () => { toast.success("Marked resolved — citizen will be asked to verify"); setResolutionDescription(""); }, onError: (err) => toast.error(apiErrorMessage(err)) }
              );
            }}
          >
            {resolve.isPending ? "Saving…" : "Mark Resolved"}
          </Button>
        </>
      )}

      {mode === "reject" && (
        <>
          <FloatingTextarea label="Rejection reason" required value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
          <Button
            variant="danger"
            className="w-full"
            disabled={reject.isPending}
            onClick={() => {
              if (rejectionReason.trim().length < 5) {
                toast.error("A rejection reason is required");
                return;
              }
              reject.mutate(
                { rejectionReason: rejectionReason.trim() },
                { onSuccess: () => { toast.success("Grievance rejected"); setRejectionReason(""); }, onError: (err) => toast.error(apiErrorMessage(err)) }
              );
            }}
          >
            {reject.isPending ? "Saving…" : "Reject Grievance"}
          </Button>
        </>
      )}
    </Card>
  );
}

export function CommentPanel({ grievanceId }: { grievanceId: string }) {
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const addComment = useAddGrievanceComment(grievanceId);

  function onSubmit() {
    if (!message.trim()) {
      toast.error("Enter a message");
      return;
    }
    addComment.mutate(
      { message: message.trim(), isPublic },
      {
        onSuccess: () => {
          toast.success(isPublic ? "Public update posted" : "Internal note added");
          setMessage("");
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      }
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-slate-800">Add Update</h3>
      <FloatingTextarea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} /> Public Update (citizen sees this)
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} /> Internal Note (staff only)
        </label>
      </div>
      <Button onClick={onSubmit} disabled={addComment.isPending} className="w-full">
        {addComment.isPending ? "Posting…" : "Post"}
      </Button>
    </Card>
  );
}
