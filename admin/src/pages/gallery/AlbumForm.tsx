import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { albumResource } from "@/api/resources";
import { api, apiErrorMessage, Paginated } from "@/api/client";
import { Album, Bilingual, Photo } from "@/types";
import { BilingualInput } from "@/components/content/BilingualInput";
import { MediaUploader, UploadedMedia } from "@/components/content/MediaUploader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { canPublish } from "@/utils/permissions";

const emptyBilingual: Bilingual = { en: "", te: "" };

function usePhotos(albumId: string | undefined) {
  return useQuery({
    queryKey: ["album-photos", albumId],
    queryFn: async () => (await api.get<{ data: Paginated<Photo> }>(`/admin/albums/${albumId}/photos`, { params: { limit: 100 } })).data.data,
    enabled: !!albumId,
  });
}

export function AlbumFormPage() {
  const { id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState(emptyBilingual);
  const [description, setDescription] = useState(emptyBilingual);
  const [location, setLocation] = useState(emptyBilingual);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDeletePhoto, setPendingDeletePhoto] = useState<Photo | null>(null);

  const { data: existing } = albumResource.useGet(isEdit ? id : undefined);
  const { data: photos } = usePhotos(isEdit ? id : undefined);
  const create = albumResource.useCreate();
  const update = albumResource.useUpdate();
  const updateStatus = albumResource.useUpdateStatus();

  const addPhotos = useMutation({
    mutationFn: async (uploaded: UploadedMedia[]) =>
      api.post(`/admin/albums/${id}/photos`, {
        photos: uploaded.map((u) => ({ imageUrl: u.imageUrl, thumbnailUrl: u.thumbnailUrl, mediumUrl: u.mediumUrl, caption_en: "", caption_te: "" })),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["album-photos", id] }),
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => api.delete(`/admin/albums/${id}/photos/${photoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["album-photos", id] }),
  });

  const reorderPhotos = useMutation({
    mutationFn: async (order: Array<{ id: string; sortOrder: number }>) => api.put(`/admin/albums/${id}/photos/reorder`, { order }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["album-photos", id] }),
  });

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description ?? emptyBilingual);
    setLocation(existing.location ?? emptyBilingual);
    setDate(existing.date ? existing.date.slice(0, 10) : "");
  }, [existing]);

  async function handleSave(publishAfter: boolean) {
    setSaving(true);
    try {
      const payload: Partial<Album> = { title, description, location, date: date ? new Date(date).toISOString() : undefined };
      const saved = isEdit ? await update.mutateAsync({ id: id!, payload }) : await create.mutateAsync(payload);
      if (publishAfter && canPublish(user?.role)) await updateStatus.mutateAsync({ id: saved._id, status: "published" });
      toast.success(isEdit ? "Album updated" : "Album created — now add photos below");
      if (!isEdit) navigate(`/gallery/albums/${saved._id}`, { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function movePhoto(photo: Photo, direction: -1 | 1) {
    if (!photos) return;
    const sorted = [...photos.items].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((p) => p._id === photo._id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    reorderPhotos.mutate(sorted.map((p, i) => ({ id: p._id, sortOrder: i })));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Album" : "New Album"}</h1>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BilingualInput label="Location" value={location} onChange={setLocation} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </Card>

      {isEdit ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-slate-800">Photos ({photos?.items.length ?? 0})</h2>
          <MediaUploader onUploaded={(u) => addPhotos.mutate(u)} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {photos?.items
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((photo) => (
                <div key={photo._id} className="overflow-hidden rounded-lg border border-slate-200">
                  <img src={photo.thumbnailUrl} alt={photo.caption.en} className="h-28 w-full object-cover" />
                  <div className="flex items-center justify-between gap-1 p-1.5">
                    <button onClick={() => movePhoto(photo, -1)} className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100">
                      ↑
                    </button>
                    <button onClick={() => movePhoto(photo, 1)} className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100">
                      ↓
                    </button>
                    <button onClick={() => setPendingDeletePhoto(photo)} className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {photos?.items.length === 0 && <p className="text-sm text-slate-400">No photos uploaded yet.</p>}
        </Card>
      ) : (
        <p className="text-sm text-slate-400">Save this album first, then you'll be able to add photos to it.</p>
      )}

      <ConfirmDialog
        open={!!pendingDeletePhoto}
        title="Delete this photo?"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (pendingDeletePhoto) deletePhoto.mutate(pendingDeletePhoto._id);
          setPendingDeletePhoto(null);
        }}
        onCancel={() => setPendingDeletePhoto(null)}
      />
    </div>
  );
}
