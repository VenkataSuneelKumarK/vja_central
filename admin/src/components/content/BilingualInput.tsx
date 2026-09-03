import { Bilingual } from "@/types";

interface Props {
  label: string;
  value: Bilingual;
  onChange: (value: Bilingual) => void;
  multiline?: boolean;
  required?: boolean;
}

// Every citizen-facing text field is entered side-by-side in English and
// Telugu (§27 of the brief) so admins translate while the context is fresh,
// rather than in a separate pass.
export function BilingualInput({ label, value, onChange, multiline, required }: Props) {
  const Field = multiline ? "textarea" : "input";
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">English</span>
          <Field
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            rows={multiline ? 4 : undefined}
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">తెలుగు (Telugu)</span>
          <Field
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            rows={multiline ? 4 : undefined}
            value={value.te}
            onChange={(e) => onChange({ ...value, te: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
