import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { videoResource } from "@/api/resources";
import { useCategories } from "@/api/categories";
import { apiErrorMessage } from "@/api/client";
import { VideoItem, Bilingual } from "@/types";
import { BilingualInput } from "@/components/content/BilingualInput";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { canPublish } from "@/utils/permissions";

const emptyBilingual: Bilingual = { en: "", te: "" };

export function VideoFormPage() {
  const { id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState(emptyBilingual);
  const [description, setDescription] = useState(emptyBilingual);
  const [source, setSource] = useState<"youtube" | "hosted">("youtube");
  const [youtubeId, setYoutubeId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: existing } = videoResource.useGet(isEdit ? id : undefined);
  const { data: categories } = useCategories("video");
  const create = videoResource.useCreate();
  const update = videoResource.useUpdate();
  const updateStatus = videoResource.useUpdateStatus();

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description ?? emptyBilingual);
    setSource(existing.source);
    setYoutubeId(existing.youtubeId ?? "");
    setVideoUrl(existing.videoUrl ?? "");
    setCategory(typeof existing.category === "string" ? existing.category : existing.category?._id ?? "");
  }, [existing]);

  async function handleSave(publishAfter: boolean) {
    setSaving(true);
    try {
      const payload: Partial<VideoItem> = {
        title,
        description,
        source,
        youtubeId: source === "youtube" ? youtubeId : undefined,
        videoUrl: source === "hosted" ? videoUrl : undefined,
        thumbnailUrl: source === "youtube" && youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : undefined,
        category: category || null,
      };
      const saved = isEdit ? await update.mutateAsync({ id: id!, payload }) : await create.mutateAsync(payload);
      if (publishAfter && canPublish(user?.role)) await updateStatus.mutateAsync({ id: saved._id, status: "published" });
      toast.success(isEdit ? "Video updated" : "Video created");
      navigate("/gallery/videos");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Video" : "New Video"}</h1>
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

      <Card className="space-y-5 p-5">
        <BilingualInput label="Title" value={title} onChange={setTitle} required />
        <BilingualInput label="Description" value={description} onChange={setDescription} multiline />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Source</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={source === "youtube"} onChange={() => setSource("youtube")} /> YouTube
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={source === "hosted"} onChange={() => setSource("hosted")} /> Hosted URL
            </label>
          </div>
        </div>

        {source === "youtube" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">YouTube Video ID</label>
            <input value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} placeholder="e.g. dQw4w9WgXcQ" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Hosted video URL</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        )}

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
      </Card>
    </div>
  );
}
