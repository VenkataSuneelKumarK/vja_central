import { ReactNode } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        You don't have permission to view this page.
      </div>
    );
  }
  return <>{children}</>;
}
