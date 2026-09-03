import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { newsResource } from "@/api/resources";
import { useCategories } from "@/api/categories";
import { apiErrorMessage } from "@/api/client";
import { NewsItem, Bilingual } from "@/types";
import { BilingualInput } from "@/components/content/BilingualInput";
import { MediaUploader, UploadedMedia } from "@/components/content/MediaUploader";
import { MobilePreview, PreviewCard } from "@/components/content/MobilePreview";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { canPublish } from "@/utils/permissions";

const emptyBilingual: Bilingual = { en: "", te: "" };

export function NewsFormPage() {
  const { id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState(emptyBilingual);
  const [summary, setSummary] = useState(emptyBilingual);
  const [content, setContent] = useState(emptyBilingual);
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: existing } = newsResource.useGet(isEdit ? id : undefined);
  const { data: categories } = useCategories("news");
  const create = newsResource.useCreate();
  const update = newsResource.useUpdate();
  const updateStatus = newsResource.useUpdateStatus();

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setSummary(existing.summary);
    setContent(existing.content);
    setCategory(typeof existing.category === "string" ? existing.category : existing.category?._id ?? "");
    setAuthor(existing.author ?? "");
    setSourceUrl(existing.sourceUrl ?? "");
    setCoverImage(existing.coverImage ?? "");
  }, [existing]);

  function handleUpload(uploaded: UploadedMedia[]) {
    if (uploaded[0]) setCoverImage(uploaded[0].imageUrl);
  }

  async function handleSave(publishAfter: boolean) {
    setSaving(true);
    try {
      const payload: Partial<NewsItem> = { title, summary, content, category: category || null, author: author || undefined, sourceUrl: sourceUrl || undefined, coverImage: coverImage || undefined };
      const saved = isEdit ? await update.mutateAsync({ id: id!, payload }) : await create.mutateAsync(payload);
      if (publishAfter && canPublish(user?.role)) await updateStatus.mutateAsync({ id: saved._id, status: "published" });
      toast.success(isEdit ? "News updated" : "News created");
      navigate("/news");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit News" : "New Article"}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={saving} onClick={() => void handleSave(false)}>
            Save Draft
          </Button>
          {canPublish(user?.role) && (
            <Button disabled={saving} onClick={() => void handleSave(true)}>
              Save &amp; Publish
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {(["edit", "preview"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-500 hover:text-slate-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "edit" && (
        <Card className="space-y-5 p-5">
          <BilingualInput label="Title" value={title} onChange={setTitle} required />
          <BilingualInput label="Summary" value={summary} onChange={setSummary} multiline required />
          <BilingualInput label="Full content" value={content} onChange={setContent} multiline required />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">None</option>
                {categories?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Author / Source</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Source URL</label>
              <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Cover image</label>
            <MediaUploader multiple={false} onUploaded={handleUpload} />
            {coverImage && <img src={coverImage} alt="" className="mt-2 h-32 rounded-lg object-cover" />}
          </div>
        </Card>
      )}

      {tab === "preview" && (
        <MobilePreview>
          <PreviewCard image={coverImage} title={title.en} description={summary.en} badge={categories?.find((c) => c._id === category)?.name.en} />
        </MobilePreview>
      )}
    </div>
  );
}
