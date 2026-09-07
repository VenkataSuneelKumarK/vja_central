import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useId } from "react";

// Material-style "notched outline" floating label: the label sits centered
// inside the field until it has focus or a value, then floats up to sit on
// top of the border with a background patch that cuts a notch through the
// border line. Built once here — every raw <input>/<select>/<textarea>
// label-above-field pattern in the app funnels through these three so the
// same border + animation shows up everywhere without hand-rolling it per
// page. Relies on Tailwind's `peer` + `placeholder-shown` variants, so the
// underlying element always renders `placeholder=" "` (a single space) even
// when the caller doesn't pass one — that space is what makes
// `:placeholder-shown` true exactly when the field is empty.
const LABEL_BASE =
  "pointer-events-none absolute left-3 z-10 origin-left bg-white px-1.5 text-slate-400 transition-all duration-200 ease-out";

type CommonProps = { label: string; required?: boolean; wrapperClassName?: string };

export function FloatingInput({
  label,
  required,
  wrapperClassName = "",
  id,
  className = "",
  ...props
}: CommonProps & Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        id={fieldId}
        placeholder=" "
        required={required}
        className={`peer w-full rounded-lg border-2 border-slate-300 bg-white/70 px-3.5 pb-2 pt-4 text-sm text-slate-900 outline-none transition-colors hover:border-slate-400 focus:border-brand-500 ${className}`}
        {...props}
      />
      <label
        htmlFor={fieldId}
        className={`${LABEL_BASE} top-1/2 -translate-y-1/2 text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.72] peer-focus:text-brand-600 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.72] peer-[:not(:placeholder-shown)]:text-slate-500`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}

export function FloatingTextarea({
  label,
  required,
  wrapperClassName = "",
  id,
  className = "",
  rows = 3,
  ...props
}: CommonProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={`relative ${wrapperClassName}`}>
      <textarea
        id={fieldId}
        placeholder=" "
        required={required}
        rows={rows}
        className={`peer w-full resize-y rounded-lg border-2 border-slate-300 bg-white/70 px-3.5 pb-2.5 pt-5 text-sm text-slate-900 outline-none transition-colors hover:border-slate-400 focus:border-brand-500 ${className}`}
        {...props}
      />
      <label
        htmlFor={fieldId}
        className={`${LABEL_BASE} top-3 text-sm peer-focus:-top-2.5 peer-focus:scale-[0.72] peer-focus:text-brand-600 peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:scale-[0.72] peer-[:not(:placeholder-shown)]:text-slate-500`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}

// <select> has no `:placeholder-shown` equivalent — it always shows a
// value — so its label stays permanently docked on the border rather than
// animating between resting/floated positions; focus still animates its
// color to match the input/textarea feedback.
export function FloatingSelect({
  label,
  required,
  wrapperClassName = "",
  id,
  className = "",
  children,
  ...props
}: CommonProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "placeholder"> & { children: ReactNode }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        id={fieldId}
        required={required}
        className={`peer w-full rounded-lg border-2 border-slate-300 bg-white/70 px-3.5 pb-2 pt-4 text-sm text-slate-900 outline-none transition-colors hover:border-slate-400 focus:border-brand-500 ${className}`}
        {...props}
      >
        {children}
      </select>
      <label htmlFor={fieldId} className={`${LABEL_BASE} -top-2.5 scale-[0.72] text-sm text-slate-500 peer-focus:text-brand-600`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}
