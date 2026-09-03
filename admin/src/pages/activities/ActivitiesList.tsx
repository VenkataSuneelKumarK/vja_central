import { ContentListPage } from "@/components/content/ContentListPage";
import { StatusCell } from "@/components/content/ContentTable";
import { activityResource } from "@/api/resources";
import { Activity } from "@/types";

export function ActivitiesListPage() {
  return (
    <ContentListPage<Activity>
      title="Activities"
      resource={activityResource}
      newHref="/activities/new"
      editHrefFor={(a) => `/activities/${a._id}`}
      columns={[
        { header: "Title", render: (a) => <span className="font-medium text-slate-800">{a.title.en}</span> },
        { header: "Date", render: (a) => new Date(a.date).toLocaleDateString() },
        { header: "Location", render: (a) => a.location.en },
        { header: "Status", render: (a) => <StatusCell status={a.status} /> },
      ]}
    />
  );
}
