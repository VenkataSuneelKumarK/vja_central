import { TFunction } from "i18next";
import { GrievanceCategory, GrievancePriority, GrievanceStatus, SlaState } from "@/types/grievance";
import { colors } from "@/theme/colors";

export function statusLabel(t: TFunction, status: GrievanceStatus): string {
  return t(`grievance.status.${status}`);
}

export function statusColor(status: GrievanceStatus): string {
  switch (status) {
    case "open":
      return colors.textMuted;
    case "assigned":
    case "in_progress":
      return colors.primary;
    case "resolved":
    case "verified":
    case "closed":
      return colors.success;
    case "reopened":
      return colors.warning;
    case "rejected":
      return colors.danger;
    default:
      return colors.textMuted;
  }
}

export function priorityLabel(t: TFunction, priority: GrievancePriority): string {
  return t(`grievance.priority.${priority}`);
}

export function priorityEmoji(priority: GrievancePriority): string {
  switch (priority) {
    case "emergency":
      return "🔴";
    case "high":
      return "🟠";
    case "normal":
      return "🟡";
    case "suggestion":
      return "🟢";
    default:
      return "";
  }
}

export function slaLabel(t: TFunction, sla: SlaState): string | null {
  if (!sla) return null;
  return t(`grievance.sla.${sla}`);
}

export function slaColor(sla: SlaState): string {
  switch (sla) {
    case "overdue":
      return colors.danger;
    case "due_soon":
      return colors.warning;
    case "on_track":
      return colors.success;
    default:
      return colors.textMuted;
  }
}

// The list/detail API populates a grievance's `category` with only
// {name, slug} (see backend grievances.citizen.routes.ts) — not its
// subCategories — so displaying a human-readable subcategory label needs a
// lookup against the full category taxonomy the New Grievance form already
// fetches and TanStack Query caches (useGrievanceCategories).
export function subCategoryLabel(
  categories: GrievanceCategory[] | undefined,
  categorySlug: string | undefined,
  subCategorySlug: string | undefined,
  lang: "en" | "te"
): string | null {
  if (!categories || !categorySlug || !subCategorySlug) return null;
  const category = categories.find((c) => c.slug === categorySlug);
  const subCategory = category?.subCategories.find((s) => s.slug === subCategorySlug);
  if (!subCategory) return null;
  return (lang === "te" && subCategory.name.te) || subCategory.name.en;
}

export const GRIEVANCE_PROGRESS_STEPS: GrievanceStatus[] = ["open", "assigned", "in_progress", "resolved", "verified", "closed"];

// Reopened/rejected are branches off the main line, not steps on it — the
// progress tracker (spec's "Submitted / Assigned / In Progress / Resolved /
// Verified / Closed" visual) only ever highlights how far along the main
// line the grievance has gotten, plus a separate badge for these branches.
export function progressIndex(status: GrievanceStatus): number {
  if (status === "reopened") return GRIEVANCE_PROGRESS_STEPS.indexOf("in_progress");
  if (status === "rejected") return -1;
  return GRIEVANCE_PROGRESS_STEPS.indexOf(status);
}
