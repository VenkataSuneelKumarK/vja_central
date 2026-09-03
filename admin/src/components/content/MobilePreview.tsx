import { ReactNode } from "react";

// Renders a phone-shaped frame around the same card layout the mobile app
// uses, so an admin can check Telugu text wrapping, image framing, and date
// formatting before publishing (§37 of the brief).
export function MobilePreview({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[28px] border-8 border-slate-800 bg-slate-800 shadow-lg">
      <div className="max-h-[560px] overflow-y-auto rounded-[20px] bg-slate-50 p-3">{children}</div>
    </div>
  );
}

export function PreviewCard({
  image,
  title,
  subtitle,
  description,
  badge,
}: {
  image?: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {image ? (
        <img src={image} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-xs text-slate-400">No cover image</div>
      )}
      <div className="p-3">
        {badge && <span className="mb-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">{badge}</span>}
        <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">{title || "Untitled"}</h4>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        {description && <p className="mt-1 text-xs text-slate-500 line-clamp-3">{description}</p>}
      </div>
    </div>
  );
}
