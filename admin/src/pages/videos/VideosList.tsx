import { ContentListPage } from "@/components/content/ContentListPage";
import { StatusCell } from "@/components/content/ContentTable";
import { videoResource } from "@/api/resources";
import { VideoItem } from "@/types";

export function VideosListPage() {
  return (
    <ContentListPage<VideoItem>
      title="Videos"
      resource={videoResource}
      newHref="/gallery/videos/new"
      editHrefFor={(v) => `/gallery/videos/${v._id}`}
      columns={[
        { header: "Title", render: (v) => <span className="font-medium text-slate-800">{v.title.en}</span> },
        { header: "Source", render: (v) => (v.source === "youtube" ? "YouTube" : "Hosted") },
        { header: "Status", render: (v) => <StatusCell status={v.status} /> },
      ]}
    />
  );
}
