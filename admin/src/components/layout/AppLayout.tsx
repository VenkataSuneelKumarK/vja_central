import { ReactNode } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
        <span className="ml-3">Loading…</span>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-mesh-light bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 text-sm text-amber-800 shadow-soft">
        You don't have permission to view this page.
      </div>
    );
  }
  return <>{children}</>;
}
