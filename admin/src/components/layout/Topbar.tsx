import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  content_admin: "Content Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="text-xs text-slate-400">{user ? roleLabels[user.role] : ""}</p>
        </div>
        <Button variant="secondary" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
