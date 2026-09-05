import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppLayout, RequireRole } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { ActivitiesListPage } from "@/pages/activities/ActivitiesList";
import { ActivityFormPage } from "@/pages/activities/ActivityForm";
import { EventsListPage } from "@/pages/events/EventsList";
import { EventFormPage } from "@/pages/events/EventForm";
import { NewsListPage } from "@/pages/news/NewsList";
import { NewsFormPage } from "@/pages/news/NewsForm";
import { AlbumsListPage } from "@/pages/gallery/AlbumsList";
import { AlbumFormPage } from "@/pages/gallery/AlbumForm";
import { VideosListPage } from "@/pages/videos/VideosList";
import { VideoFormPage } from "@/pages/videos/VideoForm";
import { AnnouncementsListPage } from "@/pages/announcements/AnnouncementsList";
import { AnnouncementFormPage } from "@/pages/announcements/AnnouncementForm";
import { CategoriesPage } from "@/pages/categories/CategoriesPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { AuditLogPage } from "@/pages/audit/AuditLogPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />

              <Route path="/activities" element={<ActivitiesListPage />} />
              <Route path="/activities/:id" element={<ActivityFormPage />} />

              <Route path="/events" element={<EventsListPage />} />
              <Route path="/events/:id" element={<EventFormPage />} />

              <Route path="/news" element={<NewsListPage />} />
              <Route path="/news/:id" element={<NewsFormPage />} />

              <Route path="/gallery/albums" element={<AlbumsListPage />} />
              <Route path="/gallery/albums/:id" element={<AlbumFormPage />} />
              <Route path="/gallery/videos" element={<VideosListPage />} />
              <Route path="/gallery/videos/:id" element={<VideoFormPage />} />

              <Route path="/announcements" element={<AnnouncementsListPage />} />
              <Route path="/announcements/:id" element={<AnnouncementFormPage />} />

              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              <Route
                path="/users"
                element={
                  <RequireRole roles={["super_admin"]}>
                    <UsersPage />
                  </RequireRole>
                }
              />
              <Route
                path="/audit-log"
                element={
                  <RequireRole roles={["super_admin"]}>
                    <AuditLogPage />
                  </RequireRole>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireRole roles={["super_admin"]}>
                    <SettingsPage />
                  </RequireRole>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
