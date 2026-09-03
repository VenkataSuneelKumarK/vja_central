// Placeholder brand palette (§26 of the brief) — the real values are fetched
// at runtime from GET /app-settings and can be swapped from the admin portal
// without an app release. These constants are the pre-fetch fallback only.
export const colors = {
  primary: "#2563EB",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  urgent: "#DC2626",
  important: "#D97706",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, full: 999 };
