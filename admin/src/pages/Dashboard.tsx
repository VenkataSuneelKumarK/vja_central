import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { DashboardStats } from "@/types";
import { Card } from "@/components/ui/Card";
import { SkeletonRows, ErrorState } from "@/components/ui/States";

const statCards: Array<{ key: keyof DashboardStats; label: string; href: string }> = [
  { key: "totalActivities", label: "Total Activities", href: "/activities" },
  { key: "activitiesToday", label: "Published Today", href: "/activities" },
  { key: "totalEvents", label: "Total Events", href: "/events" },
  { key: "upcomingEvents", label: "Upcoming Events", href: "/events" },
  { key: "totalPhotos", label: "Total Photos", href: "/gallery/albums" },
  { key: "totalVideos", label: "Total Videos", href: "/gallery/videos" },
  { key: "totalAnnouncements", label: "Announcements", href: "/announcements" },
];

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get<{ data: DashboardStats }>("/admin/dashboard/stats")).data.data,
  });

  return (
    <div className="relative min-h-[calc(100vh-6rem)] -m-6 p-6">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: "url('/dashboard-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/70 to-slate-50/10" />

      <div className="relative space-y-6">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

        {isLoading && <SkeletonRows rows={3} />}
        {isError && <ErrorState message="Couldn't load dashboard stats." onRetry={() => void refetch()} />}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {statCards.map((c) => (
                <Link key={c.key} to={c.href}>
                  <Card className="p-4 shadow-sm transition-shadow hover:shadow-md">
                    <p className="text-2xl font-semibold text-slate-900">{data[c.key] as number}</p>
                    <p className="mt-1 text-xs text-slate-400">{c.label}</p>
                  </Card>
                </Link>
              ))}
              <Card className="p-4 shadow-sm">
                <p className="text-2xl font-semibold text-slate-900">{data.notificationStats.totalSent}</p>
                <p className="mt-1 text-xs text-slate-400">Push notifications sent</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Recently Published</h2>
                {data.recentlyPublished.length === 0 && <p className="text-sm text-slate-400">Nothing published yet.</p>}
                <ul className="divide-y divide-slate-100">
                  {data.recentlyPublished.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-700">{item.title.en}</span>
                      <span className="text-xs uppercase text-slate-400">{item.type}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Recent Notifications</h2>
                {data.recentNotifications.length === 0 && <p className="text-sm text-slate-400">No notifications sent yet.</p>}
                <ul className="divide-y divide-slate-100">
                  {data.recentNotifications.map((n) => (
                    <li key={n._id} className="py-2 text-sm text-slate-700">
                      {n.title.en}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
