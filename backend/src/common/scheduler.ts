import cron from "node-cron";
import { Activity } from "@/models/Activity";
import { Event } from "@/models/Event";
import { News } from "@/models/News";
import { Album } from "@/models/Album";
import { Video } from "@/models/Video";
import { Announcement } from "@/models/Announcement";
import { logger } from "@/config/logger";

const SCHEDULABLE_MODELS = [Activity, Event, News, Album, Video, Announcement];

// Implements §24 of the brief: content created as "scheduled" with a future
// publishAt becomes "published" automatically, and published content with a
// past expiresAt (temporary announcements, time-boxed news) is archived —
// all without an admin needing to be online at the exact moment.
async function runPublishScheduler(): Promise<void> {
  const now = new Date();

  for (const model of SCHEDULABLE_MODELS) {
    const [publishedCount, expiredCount] = await Promise.all([
      model.updateMany({ status: "scheduled", publishAt: { $lte: now } }, { status: "published" }).then((r) => r.modifiedCount),
      model.updateMany({ status: "published", expiresAt: { $lte: now } }, { status: "archived" }).then((r) => r.modifiedCount),
    ]);
    if (publishedCount || expiredCount) {
      logger.info(`Scheduler: ${model.modelName} — published ${publishedCount}, archived ${expiredCount}`);
    }
  }
}

let task: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  if (task) return;
  // Every minute — content publish/expiry timing only needs minute-level precision.
  task = cron.schedule("* * * * *", () => {
    runPublishScheduler().catch((err) => logger.error("Scheduler run failed", { err }));
  });
  logger.info("Publish scheduler started");
}

export function stopScheduler(): void {
  task?.stop();
  task = null;
}

// Exported for tests / manual triggering.
export { runPublishScheduler };
