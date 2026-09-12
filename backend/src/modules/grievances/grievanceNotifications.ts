import { getFirebaseApp, isFirebaseConfigured } from "@/config/firebase";
import { logger } from "@/config/logger";
import { Types } from "mongoose";

// Unlike the broadcast-topic content notifications (which every install
// subscribes to), grievance updates are addressed to one citizen. Rather
// than storing per-device FCM tokens server-side, each citizen's app
// subscribes its device to a personal topic (citizen_<id>) right after
// login — Firebase manages that subscription entirely client-side, so the
// backend just needs to send to the right topic name. No-ops safely (with
// a log) when Firebase isn't configured, same as the content notifications.
export function citizenTopicFor(citizenId: string | Types.ObjectId): string {
  return `citizen_${citizenId}`;
}

export async function sendCitizenGrievancePush(
  citizenId: string | Types.ObjectId,
  title: string,
  body: string,
  data: { grievanceId: string; grievanceNumber: string; status?: string }
): Promise<void> {
  if (!isFirebaseConfigured()) {
    logger.warn("Firebase not configured — skipping citizen grievance push", { title });
    return;
  }
  const app = getFirebaseApp();
  if (!app) return;

  try {
    await app.messaging().send({
      topic: citizenTopicFor(citizenId),
      notification: { title, body },
      data: { grievanceId: data.grievanceId, grievanceNumber: data.grievanceNumber, status: data.status ?? "" },
    });
  } catch (err) {
    logger.error("Citizen grievance push failed", { err, citizenId: String(citizenId) });
  }
}
