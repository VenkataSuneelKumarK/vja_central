import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/api/client";

export interface UploadedVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  fileName: string;
}

const MAX_DISPLAY_MB = 200;

// Uploads to /admin/media/upload-video — the file streams straight through
// to S3 with no server-side transcoding, so the resulting videoUrl plays
// back exactly like a manually-entered "hosted URL" would (same <video>
// element on both mobile and admin preview).
export function VideoUploader({ onUploaded }: { onUploaded: (video: UploadedVideo) => void }) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await api.post("/admin/media/upload-video", form, { headers: { "Content-Type": "multipart/form-data" } });
      onUploaded(res.data.data);
      toast.success("Video uploaded");
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setFileName(null);
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
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        disabled={uploading}
        onChange={(e) => void handleFile(e.target.files)}
        className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
      />
      {uploading && <p className="mt-1 text-xs text-slate-400">Uploading{fileName ? ` ${fileName}` : ""}… this can take a while for large files.</p>}
      <p className="mt-1 text-xs text-slate-400">MP4, MOV, WebM or M4V, up to {MAX_DISPLAY_MB}MB.</p>
    </div>
  );
}
