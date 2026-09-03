import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/api/client";

export interface UploadedMedia {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
}

// Uploads to /admin/media/upload, which validates type/size, generates
// thumbnail/medium/original variants server-side, and stores originals in
// S3 (§18 of the brief) — the browser never touches storage credentials.
export function MediaUploader({ onUploaded, multiple = true }: { onUploaded: (media: UploadedMedia[]) => void; multiple?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));

    try {
      const res = await api.post("/admin/media/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      onUploaded(res.data.data);
      toast.success(`Uploaded ${res.data.data.length} image(s)`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        disabled={uploading}
        onChange={(e) => void handleFiles(e.target.files)}
        className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
      />
      {uploading && <p className="mt-1 text-xs text-slate-400">Uploading…</p>}
      <p className="mt-1 text-xs text-slate-400">JPG, PNG or WebP. Thumbnails are generated automatically.</p>
    </div>
  );
}
