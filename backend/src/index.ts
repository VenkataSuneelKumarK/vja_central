import mongoose from "mongoose";
import { env } from "@/config/env";
import { connectDB } from "@/config/db";
import { logger } from "@/config/logger";
import { createApp } from "@/app";
import { startScheduler, stopScheduler } from "@/common/scheduler";

async function main(): Promise<void> {
  await connectDB();

  // createApp() is what actually imports every route module (and therefore
  // every model) — models aren't registered on the mongoose connection
  // until this line runs, so syncIndexes() has to happen after it, not
  // right after connectDB(), or it would sync zero models. This closes a
  // real startup race: Mongoose builds declared indexes (e.g. the
  // Grievance text index) in the background, and a query that requires
  // one (like $text) 500s with "text index required" if it lands before
  // that background build finishes — most likely right after a fresh
  // deploy or db seed. Waiting here means the app never serves a request
  // before its indexes are ready.
  const app = createApp();
  await mongoose.connection.syncIndexes();

  startScheduler();

  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    stopScheduler();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error("Fatal startup error", { err });
  process.exit(1);
});
