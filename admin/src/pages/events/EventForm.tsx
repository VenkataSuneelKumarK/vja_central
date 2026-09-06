import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { eventResource } from "@/api/resources";
import { apiErrorMessage } from "@/api/client";
import { EventItem, Bilingual } from "@/types";
import { BilingualInput } from "@/components/content/BilingualInput";
import { MobilePreview, PreviewCard } from "@/components/content/MobilePreview";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingField";
import { useAuth } from "@/context/AuthContext";
import { canPublish } from "@/utils/permissions";

const emptyBilingual: Bilingual = { en: "", te: "" };

export function EventFormPage() {
  const { id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState(emptyBilingual);
  const [description, setDescription] = useState(emptyBilingual);
  const [location, setLocation] = useState(emptyBilingual);
  const [address, setAddress] = useState(emptyBilingual);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: existing } = eventResource.useGet(isEdit ? id : undefined);
  const create = eventResource.useCreate();
  const update = eventResource.useUpdate();
  const updateStatus = eventResource.useUpdateStatus();

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description);
    setLocation(existing.location);
    setAddress(existing.address ?? emptyBilingual);
    setDate(existing.date?.slice(0, 10) ?? "");
    setStartTime(existing.startTime ?? "");
    setEndTime(existing.endTime ?? "");
    setLat(existing.geo?.lat != null ? String(existing.geo.lat) : "");
    setLng(existing.geo?.lng != null ? String(existing.geo.lng) : "");
  }, [existing]);

  function buildPayload(): Partial<EventItem> {
    return {
      title,
      description,
      location,
      address,
      date: date ? new Date(date).toISOString() : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      geo: { lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null },
    };
  }

  async function handleSave(publishAfter: boolean) {
    setSaving(true);
    try {
      const payload = buildPayload();
      const saved = isEdit ? await update.mutateAsync({ id: id!, payload }) : await create.mutateAsync(payload);
      if (publishAfter && canPublish(user?.role)) await updateStatus.mutateAsync({ id: saved._id, status: "published" });
      toast.success(isEdit ? "Event updated" : "Event created");
      navigate("/events");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Event" : "New Event"}</h1>
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
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-500 hover:text-slate-700"}`}
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
          <BilingualInput label="Address" value={address} onChange={setAddress} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FloatingInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <FloatingInput label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <FloatingInput label="End time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FloatingInput label="Map latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
            <FloatingInput label="Map longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
        </Card>
      )}

      {tab === "preview" && (
        <MobilePreview>
          <PreviewCard title={title.en} subtitle={`${date ? new Date(date).toLocaleDateString() : "No date"} · ${location.en}`} description={description.en} badge="Event" />
        </MobilePreview>
      )}
    </div>
  );
}
