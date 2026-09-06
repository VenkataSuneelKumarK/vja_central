import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { DashboardStats } from "@/types";
import { Card } from "@/components/ui/Card";
import { StatIcon } from "@/components/ui/StatIcon";
import { SkeletonRows, ErrorState } from "@/components/ui/States";
import { useTheme } from "@/context/ThemeContext";

// Each stat card gets its own accent gradient (in "accent" dashboard style)
// so the grid reads as a set of distinct signals rather than one flat color
// repeated eight times.
const ACCENTS = [
  "from-brand-500 to-brand-700",
  "from-violet-500 to-purple-700",
  "from-sky-500 to-blue-700",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-700",
  "from-rose-500 to-pink-700",
  "from-indigo-500 to-blue-800",
  "from-cyan-500 to-sky-700",
];

const statCards: Array<{
  key: keyof DashboardStats;
  label: string;
  href: string;
  icon: Parameters<typeof StatIcon>[0]["name"];
}> = [
  { key: "totalActivities", label: "Total Activities", href: "/activities", icon: "activities" },
  { key: "activitiesToday", label: "Published Today", href: "/activities", icon: "published" },
  { key: "totalEvents", label: "Total Events", href: "/events", icon: "events" },
  { key: "upcomingEvents", label: "Upcoming Events", href: "/events", icon: "upcoming" },
  { key: "totalPhotos", label: "Total Photos", href: "/gallery/albums", icon: "photos" },
  { key: "totalVideos", label: "Total Videos", href: "/gallery/videos", icon: "videos" },
  { key: "totalAnnouncements", label: "Announcements", href: "/announcements", icon: "announcements" },
];

export function DashboardPage() {
  const { dashboardStyle } = useTheme();
  const accent = dashboardStyle === "accent";
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () =>
      (await api.get<{ data: DashboardStats }>("/admin/dashboard/stats")).data
        .data,
  });

  return (
    <div className="relative min-h-[calc(100vh-6rem)] -m-6 p-6">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: "url('/dashboard-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/70 to-slate-50/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />

      <div className="relative space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {accent ? <span className="text-gradient">Dashboard</span> : "Dashboard"}
          </h1>
          <p className="text-sm text-slate-400">A live overview of everything happening across the app.</p>
        </div>

        {isLoading && <SkeletonRows rows={3} />}
        {isError && (
          <ErrorState
            message="Couldn't load dashboard stats."
            onRetry={() => void refetch()}
          />
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {statCards.map((c, i) => (
                <Link key={c.key} to={c.href}>
                  <Card interactive className="p-4">
                    <div className="flex items-center justify-between">
                      <p className={`text-2xl font-bold ${accent ? "text-gradient" : "text-slate-900"}`}>
                        {data[c.key] as number}
                      </p>
                      {accent && (
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.35)] ${ACCENTS[i % ACCENTS.length]}`}
                        >
                          <StatIcon name={c.icon} />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-400">{c.label}</p>
                  </Card>
                </Link>
              ))}
              <Card interactive className="p-4">
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-bold ${accent ? "text-gradient" : "text-slate-900"}`}>
                    {data.notificationStats.totalSent}
                  </p>
                  {accent && (
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.35)] ${ACCENTS[statCards.length % ACCENTS.length]}`}
                    >
                      <StatIcon name="notifications" />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Push notifications sent
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                  Recently Published
                </h2>
                {data.recentlyPublished.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Nothing published yet.
                  </p>
                )}
                <ul className="divide-y divide-slate-100">
                  {data.recentlyPublished.map((item) => (
                    <li
                      key={`${item.type}-${item.id}`}
                      className="flex items-center justify-between py-2.5 text-sm transition-colors hover:bg-brand-50/40 -mx-1 px-1 rounded-lg"
                    >
                      <span className="text-slate-700">{item.title.en}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {item.type}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shadow-glow" />
                  Recent Notifications
                </h2>
                {data.recentNotifications.length === 0 && (
                  <p className="text-sm text-slate-400">
                    No notifications sent yet.
                  </p>
                )}
                <ul className="divide-y divide-slate-100">
                  {data.recentNotifications.map((n) => (
                    <li key={n._id} className="py-2.5 text-sm text-slate-700 transition-colors hover:bg-brand-50/40 -mx-1 px-1 rounded-lg">
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
