import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api } from "@/api/client";
import { applyBrandColor } from "@/utils/theme";

export type DashboardStyle = "classic" | "accent";

interface ThemeContextValue {
  dashboardStyle: DashboardStyle;
  // Updates the live preview immediately (used by the Settings page toggle,
  // before Save persists it). Does not call the API.
  previewDashboardStyle: (style: DashboardStyle) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Loads branding (primary color + dashboard style) from the public
// /app-settings endpoint so it applies before login too, and exposes
// dashboardStyle to any component that needs to branch its rendering.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dashboardStyle, setDashboardStyle] = useState<DashboardStyle>("classic");

  useEffect(() => {
    api
      .get<{ data: { primaryColor?: string; dashboardStyle?: DashboardStyle } }>("/app-settings")
      .then(({ data }) => {
        if (data.data.primaryColor) applyBrandColor(data.data.primaryColor);
        if (data.data.dashboardStyle) setDashboardStyle(data.data.dashboardStyle);
      })
      .catch(() => undefined);
  }, []);

  const previewDashboardStyle = useCallback((style: DashboardStyle) => setDashboardStyle(style), []);

  return <ThemeContext.Provider value={{ dashboardStyle, previewDashboardStyle }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
