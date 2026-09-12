import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { videoResource } from "@/api/resources";
import { useCategories } from "@/api/categories";
import { apiErrorMessage } from "@/api/client";
import { VideoItem, Bilingual } from "@/types";
import { BilingualInput } from "@/components/content/BilingualInput";
import { VideoUploader } from "@/components/content/VideoUploader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FloatingInput, FloatingSelect } from "@/components/ui/FloatingField";
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
  // "upload" and "hosted-url" both persist as source: "hosted" — the model
  // only distinguishes youtube vs. hosted; this third option is purely a
  // different way of filling in the same videoUrl field (via file upload
  // instead of typing a URL by hand).
  const [sourceMode, setSourceMode] = useState<"youtube" | "hosted-url" | "upload">("youtube");
  const [youtubeId, setYoutubeId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<string | null>(null);
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
    setSourceMode(existing.source === "youtube" ? "youtube" : "hosted-url");
    setYoutubeId(existing.youtubeId ?? "");
    setVideoUrl(existing.videoUrl ?? "");
    setCategory(typeof existing.category === "string" ? existing.category : existing.category?._id ?? "");
  }, [existing]);

  async function handleSave(publishAfter: boolean) {
    const source: "youtube" | "hosted" = sourceMode === "youtube" ? "youtube" : "hosted";
    if (source === "hosted" && !videoUrl) {
      toast.error(sourceMode === "upload" ? "Upload a video file first" : "Enter a hosted video URL");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<VideoItem> = {
        title,
        description,
        source,
        youtubeId: source === "youtube" ? youtubeId : undefined,
        videoUrl: source === "hosted" ? videoUrl : undefined,
        thumbnailUrl:
          source === "youtube" && youtubeId
            ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
            : sourceMode === "upload" && uploadedThumbnailUrl
              ? uploadedThumbnailUrl
              : undefined,
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
              <input type="radio" checked={sourceMode === "youtube"} onChange={() => setSourceMode("youtube")} /> YouTube
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={sourceMode === "upload"} onChange={() => setSourceMode("upload")} /> Upload File
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={sourceMode === "hosted-url"} onChange={() => setSourceMode("hosted-url")} /> Hosted URL
            </label>
          </div>
        </div>

        {sourceMode === "youtube" && (
          <FloatingInput label="YouTube Video ID (e.g. dQw4w9WgXcQ)" value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} />
        )}

        {sourceMode === "hosted-url" && (
          <FloatingInput label="Hosted video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        )}

        {sourceMode === "upload" && (
          <div className="space-y-2">
            <VideoUploader
              onUploaded={(video) => {
                setVideoUrl(video.videoUrl);
                setUploadedFileName(video.fileName);
                setUploadedThumbnailUrl(video.thumbnailUrl ?? null);
              }}
            />
            {videoUrl && uploadedFileName && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Uploaded: <span className="font-medium">{uploadedFileName}</span> — ready to save.
              </p>
            )}
          </div>
        )}

        <FloatingSelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">None</option>
          {categories?.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name.en}
            </option>
          ))}
        </FloatingSelect>
      </Card>
    </div>
  );
}
