import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { announcementResource } from "@/api/resources";
import { apiErrorMessage } from "@/api/client";
import { Announcement, AnnouncementPriority, Bilingual } from "@/types";
import { BilingualInput } from "@/components/content/BilingualInput";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { canPublish } from "@/utils/permissions";

const emptyBilingual: Bilingual = { en: "", te: "" };

export function AnnouncementFormPage() {
  const { id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState(emptyBilingual);
  const [content, setContent] = useState(emptyBilingual);
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: existing } = announcementResource.useGet(isEdit ? id : undefined);
  const create = announcementResource.useCreate();
  const update = announcementResource.useUpdate();
  const updateStatus = announcementResource.useUpdateStatus();

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setContent(existing.content);
    setPriority(existing.priority);
    setExpiresAt(existing.expiresAt ? existing.expiresAt.slice(0, 10) : "");
  }, [existing]);

  async function handleSave(publishAfter: boolean) {
    setSaving(true);
    try {
      const payload: Partial<Announcement> = { title, content, priority, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null };
      const saved = isEdit ? await update.mutateAsync({ id: id!, payload }) : await create.mutateAsync(payload);
      if (publishAfter && canPublish(user?.role)) await updateStatus.mutateAsync({ id: saved._id, status: "published" });
      toast.success(isEdit ? "Announcement updated" : "Announcement created");
      navigate("/announcements");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Announcement" : "New Announcement"}</h1>
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
        <BilingualInput label="Content" value={content} onChange={setContent} multiline required />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as AnnouncementPriority)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">Urgent/important announcements can appear as a prominent card on the home screen.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expires on (optional)</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </Card>
    </div>
  );
}
