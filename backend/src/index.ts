import { env } from "@/config/env";
import { connectDB } from "@/config/db";
import { logger } from "@/config/logger";
import { createApp } from "@/app";
import { startScheduler, stopScheduler } from "@/common/scheduler";

async function main(): Promise<void> {
  await connectDB();
  startScheduler();

  const app = createApp();
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
