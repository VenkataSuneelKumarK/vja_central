import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdmin } from "@/utils/permissions";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/activities", label: "Activities" },
  { to: "/events", label: "Events" },
  { to: "/news", label: "News" },
  { to: "/gallery/albums", label: "Photo Gallery" },
  { to: "/gallery/videos", label: "Videos" },
  { to: "/announcements", label: "Announcements" },
  { to: "/notifications", label: "Notifications" },
  { to: "/categories", label: "Categories" },
];

const superAdminItems = [
  { to: "/users", label: "Users & Roles" },
  { to: "/audit-log", label: "Audit Log" },
  { to: "/settings", label: "Branding & Settings" },
];

export function Sidebar() {
  const { user } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
      <div className="mb-6 px-2">
        <p className="text-sm font-semibold text-slate-900">VJA Central</p>
        <p className="text-xs text-slate-400">Admin Portal</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            {item.label}
          </NavLink>
        ))}
        {isSuperAdmin(user?.role) && (
          <>
            <div className="my-2 border-t border-slate-100" />
            {superAdminItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
