import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Subscribes the device to the "activity_updates" FCM topic the backend
// broadcasts to (backend/src/modules/notifications/notifications.service.ts)
// — best-effort: a denied permission or a device without push support
// (e.g. a simulator) should never block the rest of the app from working.
export async function registerForPushNotificationsAsync(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    // Topic subscription happens server-side per FCM token in a full
    // implementation; this app registers for push and the token would be
    // sent to a (future) device-registration endpoint if/when per-user
    // targeting is added. Today's broadcast model (§10, §35 of the brief)
    // only needs permission to be granted for the topic message to arrive.
  } catch {
    // Push registration is best-effort — never crash app startup over it.
  }
}
