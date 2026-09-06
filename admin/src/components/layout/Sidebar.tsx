import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdmin } from "@/utils/permissions";
import { StatIcon } from "@/components/ui/StatIcon";

const navItems: Array<{ to: string; label: string; end?: boolean; icon: Parameters<typeof StatIcon>[0]["name"] }> = [
  { to: "/", label: "Dashboard", end: true, icon: "dashboard" },
  { to: "/activities", label: "Activities", icon: "activities" },
  { to: "/events", label: "Events", icon: "events" },
  { to: "/news", label: "News", icon: "news" },
  { to: "/gallery/albums", label: "Photo Gallery", icon: "photos" },
  { to: "/gallery/videos", label: "Videos", icon: "videos" },
  { to: "/announcements", label: "Announcements", icon: "announcements" },
  { to: "/notifications", label: "Notifications", icon: "notifications" },
  { to: "/categories", label: "Categories", icon: "categories" },
];

const superAdminItems: Array<{ to: string; label: string; icon: Parameters<typeof StatIcon>[0]["name"] }> = [
  { to: "/users", label: "Users & Roles", icon: "users" },
  { to: "/audit-log", label: "Audit Log", icon: "audit" },
  { to: "/settings", label: "Branding & Settings", icon: "settings" },
];

export function Sidebar() {
  const { user } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
      isActive
        ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        : "text-slate-300/80 hover:bg-white/[0.06] hover:text-white"
    }`;

  return (
    <aside className="relative flex w-64 shrink-0 flex-col overflow-hidden bg-sidebar-gradient p-4 text-white">
      <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative mb-6 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-base font-bold shadow-glow">
          VJ
        </div>
        <div>
          <p className="text-sm font-semibold text-white">VJA Central</p>
          <p className="text-xs text-slate-400">Admin Portal</p>
        </div>
      </div>

      <nav className="scrollbar-thin relative flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-y-1 left-0 w-1 rounded-full bg-brand-400 shadow-glow" />}
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-brand-500/20 text-brand-300" : "text-slate-400 group-hover:text-slate-200"}`}>
                  <StatIcon name={item.icon} />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
        {isSuperAdmin(user?.role) && (
          <>
            <div className="my-3 border-t border-white/10" />
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Administration</p>
            {superAdminItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute inset-y-1 left-0 w-1 rounded-full bg-brand-400 shadow-glow" />}
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-brand-500/20 text-brand-300" : "text-slate-400 group-hover:text-slate-200"}`}>
                      <StatIcon name={item.icon} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
