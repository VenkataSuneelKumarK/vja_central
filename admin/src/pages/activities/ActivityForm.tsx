import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { activityResource } from "@/api/resources";
import { useCategories } from "@/api/categories";
import { apiErrorMessage } from "@/api/client";
import { Activity, Bilingual } from "@/types";
import { BilingualInput } from "@/components/content/BilingualInput";
import { MediaUploader, UploadedMedia } from "@/components/content/MediaUploader";
import { MobilePreview, PreviewCard } from "@/components/content/MobilePreview";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { canPublish } from "@/utils/permissions";

const emptyBilingual: Bilingual = { en: "", te: "" };

export function ActivityFormPage() {
  const { id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<"edit" | "media" | "preview">("edit");
  const [title, setTitle] = useState(emptyBilingual);
  const [description, setDescription] = useState(emptyBilingual);
  const [location, setLocation] = useState(emptyBilingual);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [externalLinks, setExternalLinks] = useState("");
  const [peopleInvolved, setPeopleInvolved] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: existing } = activityResource.useGet(isEdit ? id : undefined);
  const { data: categories } = useCategories("activity");
  const create = activityResource.useCreate();
  const update = activityResource.useUpdate();
  const updateStatus = activityResource.useUpdateStatus();

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description);
    setLocation(existing.location);
    setDate(existing.date?.slice(0, 10) ?? "");
    setTime(existing.time ?? "");
    setCategory(typeof existing.category === "string" ? existing.category : existing.category?._id ?? "");
    setCoverImage(existing.coverImage ?? "");
    setExternalLinks((existing.externalLinks ?? []).join("\n"));
    setPeopleInvolved((existing.peopleInvolved ?? []).join(", "));
  }, [existing]);

  function buildPayload(): Partial<Activity> {
    return {
      title,
      description,
      location,
      date: date ? new Date(date).toISOString() : undefined,
      time: time || undefined,
      category: category || null,
      coverImage: coverImage || undefined,
      media: media.map((m) => ({ url: m.imageUrl, thumbnailUrl: m.thumbnailUrl, mediumUrl: m.mediumUrl, type: "image", caption_en: "", caption_te: "" })),
      externalLinks: externalLinks.split("\n").map((l) => l.trim()).filter(Boolean),
      peopleInvolved: peopleInvolved.split(",").map((p) => p.trim()).filter(Boolean),
    };
  }

  async function handleSave(publishAfter: boolean) {
    setSaving(true);
    try {
      const payload = buildPayload();
      let saved: Activity;
      if (isEdit) {
        saved = await update.mutateAsync({ id: id!, payload });
      } else {
        saved = await create.mutateAsync(payload);
      }
      if (publishAfter && canPublish(user?.role)) {
        await updateStatus.mutateAsync({ id: saved._id, status: "published" });
      }
      toast.success(isEdit ? "Activity updated" : "Activity created");
      navigate("/activities");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Activity" : "New Activity"}</h1>
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
        {(["edit", "media", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "edit" && (
        <Card className="space-y-5 p-5">
          <BilingualInput label="Title" value={title} onChange={setTitle} required />
          <BilingualInput label="Description" value={description} onChange={setDescription} multiline required />
          <BilingualInput label="Location" value={location} onChange={setLocation} required />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
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
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">External links (one per line)</label>
            <textarea value={externalLinks} onChange={(e) => setExternalLinks(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">People / organizations involved (comma separated)</label>
            <input value={peopleInvolved} onChange={(e) => setPeopleInvolved(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </Card>
      )}

      {tab === "media" && (
        <Card className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Cover image URL</label>
            <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Set from an uploaded photo below, or paste a URL" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <MediaUploader
            onUploaded={(uploaded) => {
              setMedia((prev) => [...prev, ...uploaded]);
              if (!coverImage && uploaded[0]) setCoverImage(uploaded[0].imageUrl);
            }}
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {media.map((m, i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg border border-slate-200">
                <img src={m.thumbnailUrl} alt="" className="h-24 w-full object-cover" />
                <button
                  onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 hidden rounded bg-black/60 px-1.5 text-xs text-white group-hover:block"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "preview" && (
        <MobilePreview>
          <PreviewCard
            image={coverImage || media[0]?.imageUrl}
            title={title.en}
            subtitle={`${date ? new Date(date).toLocaleDateString() : "No date"} · ${location.en}`}
            description={description.en}
            badge={categories?.find((c) => c._id === category)?.name.en}
          />
          {title.te && (
            <div className="mt-2">
              <PreviewCard title={title.te} subtitle={location.te} description={description.te} badge="తెలుగు" />
            </div>
          )}
        </MobilePreview>
      )}
    </div>
  );
}
