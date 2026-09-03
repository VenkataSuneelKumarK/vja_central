import { getFirebaseApp, isFirebaseConfigured } from "@/config/firebase";
import { logger } from "@/config/logger";

const TOPIC = "activity_updates";

interface SendPushParams {
  title_en: string;
  title_te?: string;
  body_en: string;
  body_te?: string;
  contentType: string;
  contentId?: string;
}

interface SendPushResult {
  status: "sent" | "failed" | "skipped";
  successCount: number;
  failureCount: number;
}

// Sends to a single topic that every installed app subscribes to on first
// launch — simplest fan-out for a public-information app with no per-user
// targeting requirement. Falls back to a safe no-op when Firebase hasn't
// been configured yet (e.g. local dev), so the rest of the admin workflow
// never breaks on a missing FIREBASE_* env var.
export async function sendPushNotification(params: SendPushParams): Promise<SendPushResult> {
  if (!isFirebaseConfigured()) {
    logger.warn("Firebase not configured — skipping push notification send", { title: params.title_en });
    return { status: "skipped", successCount: 0, failureCount: 0 };
  }

  const app = getFirebaseApp();
  if (!app) return { status: "skipped", successCount: 0, failureCount: 0 };

  try {
    await app.messaging().send({
      topic: TOPIC,
      notification: { title: params.title_en, body: params.body_en },
      data: {
        contentType: params.contentType,
        contentId: params.contentId ?? "",
        title_te: params.title_te ?? "",
        body_te: params.body_te ?? "",
      },
    });
    return { status: "sent", successCount: 1, failureCount: 0 };
  } catch (err) {
    logger.error("Push notification send failed", { err });
    return { status: "failed", successCount: 0, failureCount: 1 };
  }
}
