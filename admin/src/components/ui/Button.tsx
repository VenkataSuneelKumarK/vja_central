import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-glow hover:shadow-glow-lg hover:brightness-110 disabled:opacity-50 disabled:shadow-none",
  secondary:
    "bg-white/80 text-slate-700 border border-slate-200 shadow-soft hover:bg-white hover:border-slate-300 backdrop-blur-sm",
  accent:
    "bg-white text-brand-600 border border-brand-300 shadow-soft hover:bg-brand-50 hover:shadow-glow/40",
  danger:
    "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_8px_24px_-6px_rgba(220,38,38,0.45)] hover:brightness-110 disabled:opacity-50 disabled:shadow-none",
  ghost: "text-slate-600 hover:bg-slate-100/80",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
