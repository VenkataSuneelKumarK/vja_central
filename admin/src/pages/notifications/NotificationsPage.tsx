import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, apiErrorMessage, Paginated } from "@/api/client";
import { Bilingual, ContentType } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface NotificationRecord {
  _id: string;
  title: Bilingual;
  body: Bilingual;
  status: "sent" | "failed";
  sentAt: string;
}

const emptyBilingual: Bilingual = { en: "", te: "" };

export function NotificationsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState(emptyBilingual);
  const [body, setBody] = useState(emptyBilingual);
  const [contentType, setContentType] = useState<ContentType | "general">("general");

  const { data: history } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<{ data: Paginated<NotificationRecord> }>("/admin/notifications")).data.data,
  });

  const send = useMutation({
    mutationFn: async () => api.post("/admin/notifications", { title, body, contentType }),
    onSuccess: () => {
      toast.success("Notification sent");
      setTitle(emptyBilingual);
      setBody(emptyBilingual);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send.mutate();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Push Notifications</h1>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input required placeholder="Title (English)" value={title.en} onChange={(e) => setTitle({ ...title, en: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Title (Telugu)" value={title.te} onChange={(e) => setTitle({ ...title, te: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <textarea required placeholder="Body (English)" value={body.en} onChange={(e) => setBody({ ...body, en: e.target.value })} rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <textarea placeholder="Body (Telugu)" value={body.te} onChange={(e) => setBody({ ...body, te: e.target.value })} rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <select value={contentType} onChange={(e) => setContentType(e.target.value as ContentType | "general")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="general">General</option>
            <option value="activity">Activity</option>
            <option value="event">Event</option>
            <option value="news">News</option>
            <option value="announcement">Announcement</option>
          </select>
          <Button type="submit" disabled={send.isPending}>
            Send Notification
          </Button>
        </form>
      </Card>

      <Card className="divide-y divide-slate-100">
        <h2 className="p-4 text-sm font-semibold text-slate-800">History</h2>
        {history?.items.length === 0 && <p className="p-4 text-sm text-slate-400">No notifications sent yet.</p>}
        {history?.items.map((n) => (
          <div key={n._id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium text-slate-800">{n.title.en}</p>
              <p className="text-xs text-slate-400">{new Date(n.sentAt).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${n.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{n.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
