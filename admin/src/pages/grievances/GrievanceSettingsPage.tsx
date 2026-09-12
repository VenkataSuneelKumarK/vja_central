import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingSelect } from "@/components/ui/FloatingField";
import { SkeletonRows } from "@/components/ui/States";
import { apiErrorMessage } from "@/api/client";
import {
  useDepartments,
  useOfficers,
  useCreateDepartment,
  useCreateOfficer,
  useGrievanceSlaConfig,
  useUpdateGrievanceSlaConfig,
} from "@/api/grievances";

export function GrievanceSettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Grievance Settings</h1>
        <p className="text-sm text-slate-400">Departments, officers and SLA targets used by the Praja Samvad grievance module.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SlaConfigCard />
        <DepartmentsCard />
        <OfficersCard />
      </div>
    </div>
  );
}

function SlaConfigCard() {
  const { data, isLoading } = useGrievanceSlaConfig();
  const update = useUpdateGrievanceSlaConfig();
  const [form, setForm] = useState({ emergencyHours: 24, highHours: 72, normalHours: 168, suggestionHours: 336 });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading) return <SkeletonRows rows={3} />;

  return (
    <Card className="space-y-3 p-5">
      <h3 className="text-sm font-semibold text-slate-800">SLA Targets (hours)</h3>
      <p className="text-xs text-slate-400">Due dates are computed as submitted-at + this many hours, based on priority.</p>
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput label="🔴 Emergency" type="number" min={1} value={form.emergencyHours} onChange={(e) => setForm({ ...form, emergencyHours: Number(e.target.value) })} />
        <FloatingInput label="🟠 High" type="number" min={1} value={form.highHours} onChange={(e) => setForm({ ...form, highHours: Number(e.target.value) })} />
        <FloatingInput label="🟡 Normal" type="number" min={1} value={form.normalHours} onChange={(e) => setForm({ ...form, normalHours: Number(e.target.value) })} />
        <FloatingInput label="🟢 Suggestion" type="number" min={1} value={form.suggestionHours} onChange={(e) => setForm({ ...form, suggestionHours: Number(e.target.value) })} />
      </div>
      <Button
        className="w-full"
        disabled={update.isPending}
        onClick={() => update.mutate(form, { onSuccess: () => toast.success("SLA targets updated"), onError: (err) => toast.error(apiErrorMessage(err)) })}
      >
        {update.isPending ? "Saving…" : "Save SLA Targets"}
      </Button>
    </Card>
  );
}

function DepartmentsCard() {
  const { data: departments, isLoading } = useDepartments();
  const create = useCreateDepartment();
  const [nameEn, setNameEn] = useState("");
  const [nameTe, setNameTe] = useState("");

  function onAdd() {
    if (!nameEn.trim()) {
      toast.error("Enter a department name");
      return;
    }
    create.mutate(
      { name: { en: nameEn.trim(), te: nameTe.trim() || nameEn.trim() } },
      {
        onSuccess: () => {
          toast.success("Department added");
          setNameEn("");
          setNameTe("");
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      }
    );
  }

  return (
    <Card className="space-y-3 p-5">
      <h3 className="text-sm font-semibold text-slate-800">Departments</h3>
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-slate-600">
          {departments?.map((d) => (
            <li key={d._id} className="rounded-lg bg-slate-50 px-3 py-1.5">
              {d.name.en}
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        <FloatingInput label="Name (English)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        <FloatingInput label="Name (Telugu)" value={nameTe} onChange={(e) => setNameTe(e.target.value)} />
      </div>
      <Button className="w-full" disabled={create.isPending} onClick={onAdd}>
        {create.isPending ? "Adding…" : "Add Department"}
      </Button>
    </Card>
  );
}

function OfficersCard() {
  const { data: departments } = useDepartments();
  const { data: officers, isLoading } = useOfficers();
  const create = useCreateOfficer();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [department, setDepartment] = useState("");

  function onAdd() {
    if (!name.trim() || !department) {
      toast.error("Enter a name and select a department");
      return;
    }
    create.mutate(
      { name: name.trim(), mobile: mobile.trim() || undefined, department },
      {
        onSuccess: () => {
          toast.success("Officer added");
          setName("");
          setMobile("");
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      }
    );
  }

  return (
    <Card className="space-y-3 p-5 lg:col-span-2">
      <h3 className="text-sm font-semibold text-slate-800">Officers</h3>
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-slate-600">
          {officers?.map((o) => (
            <li key={o._id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-1.5">
              <span>{o.name}</span>
              <span className="text-slate-400">{typeof o.department === "object" ? o.department.name.en : ""}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-3 gap-2">
        <FloatingInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <FloatingInput label="Mobile (optional)" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        <FloatingSelect label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">Select</option>
          {departments?.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name.en}
            </option>
          ))}
        </FloatingSelect>
      </div>
      <Button className="w-full" disabled={create.isPending} onClick={onAdd}>
        {create.isPending ? "Adding…" : "Add Officer"}
      </Button>
    </Card>
  );
}
