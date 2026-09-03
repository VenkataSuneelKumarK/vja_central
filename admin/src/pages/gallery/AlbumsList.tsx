import { ContentListPage } from "@/components/content/ContentListPage";
import { StatusCell } from "@/components/content/ContentTable";
import { albumResource } from "@/api/resources";
import { Album } from "@/types";

export function AlbumsListPage() {
  return (
    <ContentListPage<Album>
      title="Photo Albums"
      resource={albumResource}
      newHref="/gallery/albums/new"
      editHrefFor={(a) => `/gallery/albums/${a._id}`}
      columns={[
        { header: "Title", render: (a) => <span className="font-medium text-slate-800">{a.title.en}</span> },
        { header: "Location", render: (a) => a.location?.en || "—" },
        { header: "Status", render: (a) => <StatusCell status={a.status} /> },
      ]}
    />
  );
}
