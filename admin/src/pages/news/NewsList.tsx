import { ContentListPage } from "@/components/content/ContentListPage";
import { StatusCell } from "@/components/content/ContentTable";
import { newsResource } from "@/api/resources";
import { NewsItem } from "@/types";

export function NewsListPage() {
  return (
    <ContentListPage<NewsItem>
      title="News"
      resource={newsResource}
      newHref="/news/new"
      editHrefFor={(n) => `/news/${n._id}`}
      columns={[
        { header: "Title", render: (n) => <span className="font-medium text-slate-800">{n.title.en}</span> },
        { header: "Author", render: (n) => n.author || "—" },
        { header: "Status", render: (n) => <StatusCell status={n.status} /> },
      ]}
    />
  );
}
