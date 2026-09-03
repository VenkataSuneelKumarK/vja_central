import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api, setAccessToken } from "@/api/client";
import { CurrentUser } from "@/types";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, try to silently establish a session from the refresh
  // cookie (set on a prior login) so a page refresh doesn't force re-login.
  useEffect(() => {
    (async () => {
      try {
        const res = await api.post("/admin/auth/refresh");
        setAccessToken(res.data.data.accessToken);
        const me = await api.get("/admin/auth/me");
        setUser(me.data.data);
      } catch {
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/admin/auth/login", { email, password });
    setAccessToken(res.data.data.accessToken);
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/admin/auth/logout").catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
