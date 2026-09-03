import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface AppSettings {
  logoUrl?: string;
  profileImageUrl?: string;
  splashImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
}

export function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => (await api.get<{ data: AppSettings }>("/admin/settings")).data.data,
  });

  const [form, setForm] = useState<AppSettings>({ primaryColor: "#2563EB", secondaryColor: "#1E3A8A" });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => api.put("/admin/settings", form),
    onSuccess: () => {
      toast.success("Branding updated");
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Branding &amp; Settings</h1>
      <p className="text-sm text-slate-400">These values are served to the mobile app at launch — no app release needed to rebrand.</p>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Logo URL</label>
              <input value={form.logoUrl ?? ""} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Profile Image URL</label>
              <input value={form.profileImageUrl ?? ""} onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Splash Image URL</label>
              <input value={form.splashImageUrl ?? ""} onChange={(e) => setForm({ ...form, splashImageUrl: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="h-9 w-9 rounded border border-slate-300" />
                <input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="h-9 w-9 rounded border border-slate-300" />
                <input value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contact Phone</label>
              <input value={form.contactPhone ?? ""} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contact Email</label>
              <input value={form.contactEmail ?? ""} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contact Address</label>
              <input value={form.contactAddress ?? ""} onChange={(e) => setForm({ ...form, contactAddress: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Privacy Policy URL</label>
              <input value={form.privacyPolicyUrl ?? ""} onChange={(e) => setForm({ ...form, privacyPolicyUrl: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Terms URL</label>
              <input value={form.termsUrl ?? ""} onChange={(e) => setForm({ ...form, termsUrl: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <Button type="submit" disabled={save.isPending}>
            Save Settings
          </Button>
        </form>
      </Card>
    </div>
  );
}
