import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Grievance, GrievanceStatus } from "@/types/grievance";
import { statusLabels, priorityLabels } from "./GrievanceBadges";

// jspdf-autotable sets `doc.lastAutoTable` on the jsPDF instance at runtime
// (used below to know where one table ended so the next category's heading
// can be placed right after it), but this version's own .d.ts doesn't
// declare the property — hence the narrow, local-only cast instead of
// reaching for `any`.
type DocWithLastTable = jsPDF & { lastAutoTable?: { finalY: number } };

// TypeScript's bundled DOM lib already types FileSystemFileHandle /
// FileSystemWritableFileStream (from the older File System Access surface)
// but not `window.showSaveFilePicker` itself or its options — that part of
// the spec (including the `startIn` well-known-directory hint this file
// relies on) isn't in this TS version's lib.dom.d.ts yet.
interface SaveFilePickerOptions {
  suggestedName?: string;
  startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}
declare global {
  interface Window {
    showSaveFilePicker?(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}

const COMPLETED_STATUSES: GrievanceStatus[] = ["resolved", "verified", "closed"];
const MARGIN = 32;

function categoryName(g: Grievance): string {
  return typeof g.category === "object" ? g.category.name.en : "Uncategorized";
}
function departmentName(g: Grievance): string {
  return g.department && typeof g.department === "object" ? g.department.name.en : "—";
}
function officerName(g: Grievance): string {
  if (g.assignedOfficer && typeof g.assignedOfficer === "object") return g.assignedOfficer.name;
  return g.assignedOfficerName || "—";
}

const FULL_HEAD = ["ID", "Heading", "Citizen", "Category", "Area / Ward", "Priority", "Status", "Department", "Officer", "Due Date", "Submitted"];
const GROUP_HEAD = ["ID", "Heading", "Citizen", "Area / Ward", "Priority", "Status", "Department", "Officer", "Due Date", "Submitted"];

function rowFor(g: Grievance, showCategory: boolean): string[] {
  const row = [g.grievanceNumber, g.heading, `${g.citizenName}\n${g.citizenMobile}`];
  if (showCategory) row.push(`${categoryName(g)}${g.subCategory ? ` / ${g.subCategory}` : ""}`);
  row.push(
    `${g.area || "—"}${g.ward ? ` (Ward ${g.ward})` : ""}`,
    priorityLabels[g.priority],
    statusLabels[g.status],
    departmentName(g),
    officerName(g),
    g.dueDate ? new Date(g.dueDate).toLocaleDateString() : "—",
    new Date(g.createdAt).toLocaleDateString()
  );
  return row;
}

// Draws the title/subtitle/generated-at/filters block, shared between the
// first page and any later page a long report spills onto, and returns the
// y-coordinate the table (or "no results" message) should start at.
function drawHeader(doc: jsPDF, mode: "flat" | "category", total: number, filterSummary: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Praja Samvad — Grievances Report", MARGIN, 36);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(mode === "category" ? "Grouped by Category" : "Full List", MARGIN, 50);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - MARGIN, 36, { align: "right" });
  doc.text(`Total records: ${total}`, pageWidth - MARGIN, 50, { align: "right" });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(MARGIN, 58, pageWidth - MARGIN, 58);

  let y = 74;
  if (filterSummary) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const wrapped = doc.splitTextToSize(`Filters applied: ${filterSummary}`, pageWidth - MARGIN * 2);
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 12 + 8;
    doc.setFont("helvetica", "normal");
  }
  return y;
}

const TABLE_STYLES = {
  styles: { fontSize: 8, cellPadding: 4, valign: "top" as const, lineColor: [0, 0, 0] as [number, number, number], lineWidth: 0.5 },
  headStyles: { fillColor: [241, 245, 249] as [number, number, number], textColor: [0, 0, 0] as [number, number, number], fontStyle: "bold" as const },
};

// Saves the PDF, preferring the Downloads folder as the starting point.
//
// Chrome/Edge users who have "Always ask where to save each file" enabled
// (as opposed to the default "just download it") get a native Save As
// dialog for every download — and that dialog opens wherever the browser
// last saved *any* file, which is often Documents/Desktop, not Downloads.
// The File System Access API's `showSaveFilePicker({ startIn: "downloads" })`
// lets a site suggest Downloads as that starting folder; a plain
// `<a download>` (used as the fallback below, and by jsPDF's own .save())
// has no such control — the browser decides unilaterally.
//
// Only Chromium browsers (Chrome/Edge/Opera) support showSaveFilePicker;
// Firefox and Safari fall through to the classic download, which behaves
// exactly as it did before this change.
async function savePdf(doc: jsPDF, filename: string): Promise<void> {
  const blob = doc.output("blob");

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        startIn: "downloads",
        types: [{ description: "PDF Document", accept: { "application/pdf": [".pdf"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      // AbortError means the user cancelled the picker — respect that
      // instead of silently falling back to an auto-download they didn't
      // ask for. Any other error (e.g. picker unsupported in this
      // particular Chromium build) falls through to the classic download.
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Generates the report as a real PDF file and saves it — unlike the
// previous window.print() flow, this never opens the OS *print* dialog;
// see savePdf() above for how it also steers a same-browser Save As dialog
// (when the user has one enabled) toward Downloads.
export async function generateGrievancePdf(items: Grievance[], mode: "flat" | "category", filterSummary: string): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const startY = drawHeader(doc, mode, items.length, filterSummary);

  if (items.length === 0) {
    doc.setFontSize(11);
    doc.text("No grievances match the current filters.", MARGIN, startY + 10);
  } else if (mode === "flat") {
    autoTable(doc, { head: [FULL_HEAD], body: items.map((g) => rowFor(g, true)), startY, margin: { left: MARGIN, right: MARGIN }, ...TABLE_STYLES });
  } else {
    const groups = Object.values(
      items.reduce<Record<string, { name: string; items: Grievance[] }>>((acc, g) => {
        const key = typeof g.category === "object" ? g.category._id : "uncategorized";
        if (!acc[key]) acc[key] = { name: categoryName(g), items: [] };
        acc[key].items.push(g);
        return acc;
      }, {})
    ).sort((a, b) => b.items.length - a.items.length);

    let y = startY;
    for (const group of groups) {
      const resolved = group.items.filter((g) => COMPLETED_STATUSES.includes(g.status)).length;
      const heading = `${group.name} — ${group.items.length} total · ${resolved} resolved · ${group.items.length - resolved} pending`;

      if (y > pageHeight - 100) {
        doc.addPage();
        y = drawHeader(doc, mode, items.length, filterSummary);
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(heading, MARGIN, y);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y + 4, doc.internal.pageSize.getWidth() - MARGIN, y + 4);
      y += 16;

      autoTable(doc, { head: [GROUP_HEAD], body: group.items.map((g) => rowFor(g, false)), startY: y, margin: { left: MARGIN, right: MARGIN }, ...TABLE_STYLES });
      y = ((doc as DocWithLastTable).lastAutoTable?.finalY ?? y) + 24;
    }
  }

  await savePdf(doc, `grievances-${mode}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
