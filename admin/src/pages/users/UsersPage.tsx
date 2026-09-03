import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/api/client";
import { AdminUser, Role } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const ROLES: Role[] = ["super_admin", "content_admin", "editor", "viewer"];

export function UsersPage() {
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get<{ data: AdminUser[] }>("/admin/users")).data.data,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("editor");

  const createUser = useMutation({
    mutationFn: async () => api.post("/admin/users", { name, email, password, role }),
    onSuccess: () => {
      toast.success("User created");
      setName("");
      setEmail("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AdminUser> }) => api.put(`/admin/users/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createUser.mutate();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Users &amp; Roles</h1>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Temp. Password</label>
            <input required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={createUser.isPending}>
            Add User
          </Button>
        </form>
      </Card>

      <Card className="divide-y divide-slate-100">
        {users?.map((u) => (
          <div key={u._id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium text-slate-800">{u.name}</p>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={u.role}
                onChange={(e) => updateUser.mutate({ id: u._id, patch: { role: e.target.value as Role } })}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <Button variant={u.isActive ? "danger" : "secondary"} onClick={() => updateUser.mutate({ id: u._id, patch: { isActive: !u.isActive } })}>
                {u.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
