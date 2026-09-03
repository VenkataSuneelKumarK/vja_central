import admin from "firebase-admin";
import { env } from "./env";
import { logger } from "./logger";

let app: admin.app.App | null = null;

// Push notifications are optional in local/staging environments where a
// Firebase project hasn't been provisioned yet — every call site checks
// `isFirebaseConfigured()` and no-ops (with a log) rather than throwing.
export function isFirebaseConfigured(): boolean {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

export function getFirebaseApp(): admin.app.App | null {
  if (!isFirebaseConfigured()) return null;
  if (app) return app;

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  logger.info("Firebase Admin initialized");
  return app;
}
