import { ExpoConfig, ConfigContext } from "expo/config";

// Dynamic config so the API URL (and any future per-environment value) comes
// from the build environment rather than being hard-coded into the bundle
// (§37/§38 of the brief). Set API_BASE_URL when running `expo start` or in
// the EAS build profile's env — see .env.example.
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000/api";
const APP_ENV = process.env.APP_ENV ?? "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Mana Vijayawada",
  slug: "vja-central",
  scheme: "vjacentral",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0B1F45",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP_ENV === "production" ? "com.vjacentral.app" : `com.vjacentral.app.${APP_ENV}`,
    infoPlist: { UIBackgroundModes: ["remote-notification"] },
  },
  android: {
    package: APP_ENV === "production" ? "com.vjacentral.app" : `com.vjacentral.app.${APP_ENV}`,
    adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#2563EB" },
    permissions: ["NOTIFICATIONS"],
  },
  plugins: ["expo-notifications"],
  extra: {
    apiBaseUrl: API_BASE_URL,
    appEnv: APP_ENV,
  },
});
