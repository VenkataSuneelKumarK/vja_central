import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/Button";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  content_admin: "Content Admin",
  editor: "Editor",
  viewer: "Viewer",
};

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || name[0]?.toUpperCase();
}

export function Topbar() {
  const { user, logout } = useAuth();
  const { dashboardStyle } = useTheme();
  return (
    <header className="glass sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/70 px-6 shadow-[0_1px_0_rgba(255,255,255,0.6)]">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white shadow-glow">
            {initials(user?.name)}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-400">{user ? roleLabels[user.role] : ""}</p>
          </div>
        </div>
        <Button variant={dashboardStyle === "accent" ? "accent" : "secondary"} onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
