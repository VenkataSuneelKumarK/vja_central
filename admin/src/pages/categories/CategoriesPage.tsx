import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { useCategories, useCreateCategory } from "@/api/categories";
import { apiErrorMessage } from "@/api/client";
import { ContentType } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { canWrite } from "@/utils/permissions";
import { useAuth } from "@/context/AuthContext";

const CONTENT_TYPES: ContentType[] = ["activity", "event", "news", "album", "video", "announcement"];

export function CategoriesPage() {
  const { user } = useAuth();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();

  const [nameEn, setNameEn] = useState("");
  const [nameTe, setNameTe] = useState("");
  const [slug, setSlug] = useState("");
  const [appliesTo, setAppliesTo] = useState<ContentType[]>(["activity"]);

  function toggleType(t: ContentType) {
    setAppliesTo((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await createCategory.mutateAsync({ name: { en: nameEn, te: nameTe }, slug, appliesTo });
      toast.success("Category created");
      setNameEn("");
      setNameTe("");
      setSlug("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Categories</h1>
      <p className="text-sm text-slate-400">Categories are configurable — not hard-coded — and can apply to multiple content types.</p>

      {canWrite(user?.role) && (
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name (English)</label>
              <input required value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name (Telugu)</label>
              <input value={nameTe} onChange={(e) => setNameTe(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Slug</label>
              <input required value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="e.g. public-activities" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Applies to</label>
              <div className="flex flex-wrap gap-3">
                {CONTENT_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-sm capitalize">
                    <input type="checkbox" checked={appliesTo.includes(t)} onChange={() => toggleType(t)} /> {t}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createCategory.isPending}>
                Add Category
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="divide-y divide-slate-100">
        {isLoading && <p className="p-4 text-sm text-slate-400">Loading…</p>}
        {categories?.map((c) => (
          <div key={c._id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {c.name.en} {c.name.te && <span className="text-slate-400">· {c.name.te}</span>}
              </p>
              <p className="text-xs text-slate-400">{c.appliesTo.join(", ")}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{c.slug}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
