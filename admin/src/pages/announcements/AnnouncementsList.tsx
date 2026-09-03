import { ContentListPage } from "@/components/content/ContentListPage";
import { StatusCell } from "@/components/content/ContentTable";
import { announcementResource } from "@/api/resources";
import { Announcement } from "@/types";

const priorityStyles: Record<string, string> = {
  normal: "bg-slate-100 text-slate-700",
  important: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-700",
};

export function AnnouncementsListPage() {
  return (
    <ContentListPage<Announcement>
      title="Announcements"
      resource={announcementResource}
      newHref="/announcements/new"
      editHrefFor={(a) => `/announcements/${a._id}`}
      columns={[
        { header: "Title", render: (a) => <span className="font-medium text-slate-800">{a.title.en}</span> },
        {
          header: "Priority",
          render: (a) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityStyles[a.priority]}`}>{a.priority}</span>,
        },
        { header: "Status", render: (a) => <StatusCell status={a.status} /> },
      ]}
    />
  );
}
