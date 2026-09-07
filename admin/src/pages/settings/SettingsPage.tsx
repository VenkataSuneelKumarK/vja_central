import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingField";
import { applyBrandColor } from "@/utils/theme";
import { useTheme, DashboardStyle } from "@/context/ThemeContext";

interface AppSettings {
  logoUrl?: string;
  profileImageUrl?: string;
  splashImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  dashboardStyle: DashboardStyle;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
}

const DASHBOARD_STYLE_OPTIONS: Array<{ value: DashboardStyle; label: string; description: string }> = [
  { value: "classic", label: "Classic", description: "Plain stat cards, neutral sign-out button." },
  { value: "accent", label: "Neutral accent", description: "Icon chips on stat cards + an accent-colored sign-out button." },
];

export function SettingsPage() {
  const qc = useQueryClient();
  const { previewDashboardStyle } = useTheme();
  const { data } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => (await api.get<{ data: AppSettings }>("/admin/settings")).data.data,
  });

  const [form, setForm] = useState<AppSettings>({ primaryColor: "#2563EB", secondaryColor: "#1E3A8A", dashboardStyle: "classic" });

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
            <FloatingInput label="Logo URL" value={form.logoUrl ?? ""} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
            <FloatingInput label="Profile Image URL" value={form.profileImageUrl ?? ""} onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })} />
            <FloatingInput label="Splash Image URL" value={form.splashImageUrl ?? ""} onChange={(e) => setForm({ ...form, splashImageUrl: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Primary Color</label>
              <p className="mb-1 text-xs text-slate-400">Recolors this admin portal live as you pick — Save to make it permanent.</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => {
                    setForm({ ...form, primaryColor: e.target.value });
                    applyBrandColor(e.target.value);
                  }}
                  className="h-[42px] w-11 shrink-0 rounded-lg border-2 border-slate-300"
                />
                <FloatingInput
                  wrapperClassName="flex-1"
                  label="Hex value"
                  value={form.primaryColor}
                  onChange={(e) => {
                    setForm({ ...form, primaryColor: e.target.value });
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) applyBrandColor(e.target.value);
                  }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="h-[42px] w-11 shrink-0 rounded-lg border-2 border-slate-300" />
                <FloatingInput wrapperClassName="flex-1" label="Hex value" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dashboard Style</label>
            <p className="mb-2 text-xs text-slate-400">Switches live in this portal as you pick — Save to make it permanent.</p>
            <div className="flex gap-3">
              {DASHBOARD_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, dashboardStyle: opt.value });
                    previewDashboardStyle(opt.value);
                  }}
                  className={`flex-1 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    form.dashboardStyle === opt.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-medium">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FloatingInput label="Contact Phone" value={form.contactPhone ?? ""} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <FloatingInput label="Contact Email" value={form.contactEmail ?? ""} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <FloatingInput label="Contact Address" value={form.contactAddress ?? ""} onChange={(e) => setForm({ ...form, contactAddress: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FloatingInput label="Privacy Policy URL" value={form.privacyPolicyUrl ?? ""} onChange={(e) => setForm({ ...form, privacyPolicyUrl: e.target.value })} />
            <FloatingInput label="Terms URL" value={form.termsUrl ?? ""} onChange={(e) => setForm({ ...form, termsUrl: e.target.value })} />
          </div>

          <Button type="submit" disabled={save.isPending}>
            Save Settings
          </Button>
        </form>
      </Card>
    </div>
  );
}
