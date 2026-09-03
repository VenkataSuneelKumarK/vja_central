import { ContentListPage } from "@/components/content/ContentListPage";
import { StatusCell } from "@/components/content/ContentTable";
import { eventResource } from "@/api/resources";
import { EventItem } from "@/types";

export function EventsListPage() {
  return (
    <ContentListPage<EventItem>
      title="Events"
      resource={eventResource}
      newHref="/events/new"
      editHrefFor={(e) => `/events/${e._id}`}
      columns={[
        { header: "Title", render: (e) => <span className="font-medium text-slate-800">{e.title.en}</span> },
        { header: "Date", render: (e) => new Date(e.date).toLocaleDateString() },
        { header: "Location", render: (e) => e.location.en },
        { header: "Status", render: (e) => <StatusCell status={e.status} /> },
      ]}
    />
  );
}
