import axios from "axios";
import Constants from "expo-constants";

// Never hard-coded — comes from app.config.ts, which reads API_BASE_URL from
// the build environment (§37/§38 of the brief).
export const API_BASE_URL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// The mobile app never shows a raw technical error (§34 of the brief) — every
// screen renders this instead and logs the real error for developers only.
export function friendlyErrorMessage(): string {
  return "We couldn't load the latest updates. Please try again.";
}
