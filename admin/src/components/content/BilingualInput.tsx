import { Bilingual } from "@/types";
import { FloatingInput, FloatingTextarea } from "@/components/ui/FloatingField";

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
  const Field = multiline ? FloatingTextarea : FloatingInput;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field rows={multiline ? 4 : undefined} label="English" value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} />
        <Field rows={multiline ? 4 : undefined} label="తెలుగు (Telugu)" value={value.te} onChange={(e) => onChange({ ...value, te: e.target.value })} />
      </div>
    </div>
  );
}
