import { HTMLAttributes } from "react";

export function Card({
  className = "",
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white/90 shadow-soft backdrop-blur-sm ${
        interactive ? "lift-hover cursor-pointer hover:shadow-elevated hover:border-brand-200" : ""
      } ${className}`}
      {...props}
    />
  );
}
