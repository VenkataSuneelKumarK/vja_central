import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import { env } from "@/config/env";
import { apiRateLimiter } from "@/middleware/rateLimit";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";

import { authRouter } from "@/modules/auth/auth.routes";
import { activitiesPublicRouter, activitiesAdminRouter } from "@/modules/activities/activities.routes";
import { eventsPublicRouter, eventsAdminRouter } from "@/modules/events/events.routes";
import { newsPublicRouter, newsAdminRouter } from "@/modules/news/news.routes";
import { albumsPublicRouter, albumsAdminRouter } from "@/modules/albums/albums.routes";
import { videosPublicRouter, videosAdminRouter } from "@/modules/videos/videos.routes";
import { announcementsPublicRouter, announcementsAdminRouter } from "@/modules/announcements/announcements.routes";
import { categoriesPublicRouter, categoriesAdminRouter } from "@/modules/categories/categories.routes";
import { notificationsAdminRouter } from "@/modules/notifications/notifications.routes";
import { dashboardAdminRouter } from "@/modules/dashboard/dashboard.routes";
import { usersAdminRouter } from "@/modules/users/users.routes";
import { mediaAdminRouter } from "@/modules/media/media.routes";
import { homeRouter } from "@/modules/home/home.routes";
import { searchRouter } from "@/modules/search/search.routes";
import { auditAdminRouter } from "@/modules/audit/audit.routes";
import { settingsPublicRouter, settingsAdminRouter } from "@/modules/settings/settings.routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // behind an ALB in production

  app.use(helmet());
  app.use(
    cors({
      origin: env.ADMIN_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(apiRateLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // --- Public API (read-only, unauthenticated, consumed by mobile apps) ---
  app.use("/api", homeRouter);
  app.use("/api", searchRouter);
  app.use("/api", activitiesPublicRouter);
  app.use("/api", eventsPublicRouter);
  app.use("/api", newsPublicRouter);
  app.use("/api", albumsPublicRouter);
  app.use("/api", videosPublicRouter);
  app.use("/api", announcementsPublicRouter);
  app.use("/api", categoriesPublicRouter);
  app.use("/api", settingsPublicRouter);

  // --- Admin API (JWT + RBAC gated, consumed by the admin portal) ---
  app.use("/api/admin/auth", authRouter);
  app.use("/api/admin/activities", activitiesAdminRouter);
  app.use("/api/admin/events", eventsAdminRouter);
  app.use("/api/admin/news", newsAdminRouter);
  app.use("/api/admin/albums", albumsAdminRouter);
  app.use("/api/admin/videos", videosAdminRouter);
  app.use("/api/admin/announcements", announcementsAdminRouter);
  app.use("/api/admin/categories", categoriesAdminRouter);
  app.use("/api/admin/notifications", notificationsAdminRouter);
  app.use("/api/admin/dashboard", dashboardAdminRouter);
  app.use("/api/admin/users", usersAdminRouter);
  app.use("/api/admin/media", mediaAdminRouter);
  app.use("/api/admin/audit-log", auditAdminRouter);
  app.use("/api/admin/settings", settingsAdminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
