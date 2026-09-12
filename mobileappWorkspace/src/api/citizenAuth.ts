import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ApiEnvelope } from "@/api/client";

export interface CitizenProfile {
  id: string;
  username: string;
  mobile: string;
  fullName?: string;
}

interface CitizenSession {
  accessToken: string;
  refreshToken: string;
  citizen: CitizenProfile;
}

const STORAGE_KEY = "vja_citizen_session";

let currentSession: CitizenSession | null = null;
let hydrated = false;
let refreshInFlight: Promise<string | null> | null = null;
const listeners = new Set<(session: CitizenSession | null) => void>();

async function persist(session: CitizenSession | null): Promise<void> {
  currentSession = session;
  if (session) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else await AsyncStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener(session));
}

// Called once on app startup (mirrors initI18n's pattern in App.tsx) so the
// in-memory session is ready before any screen renders.
export async function hydrateCitizenSession(): Promise<CitizenSession | null> {
  if (hydrated) return currentSession;
  hydrated = true;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  currentSession = raw ? (JSON.parse(raw) as CitizenSession) : null;
  return currentSession;
}

export function getCitizenSession(): CitizenSession | null {
  return currentSession;
}

export function subscribeCitizenSession(fn: (session: CitizenSession | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  citizen: CitizenProfile;
}

export async function citizenRegister(payload: {
  username: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
}): Promise<CitizenProfile> {
  const res = await api.post<ApiEnvelope<AuthResponse>>("/citizen/auth/register", payload);
  const { accessToken, refreshToken, citizen } = res.data.data;
  await persist({ accessToken, refreshToken, citizen });
  return citizen;
}

export async function citizenLogin(payload: { identifier: string; password: string }): Promise<CitizenProfile> {
  const res = await api.post<ApiEnvelope<AuthResponse>>("/citizen/auth/login", payload);
  const { accessToken, refreshToken, citizen } = res.data.data;
  await persist({ accessToken, refreshToken, citizen });
  return citizen;
}

export async function citizenLogout(): Promise<void> {
  try {
    await api.post("/citizen/auth/logout");
  } catch {
    // Best-effort — the local session is cleared regardless.
  }
  await persist(null);
}

async function refreshAccessToken(): Promise<string | null> {
  if (!currentSession) return null;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await api.post<ApiEnvelope<{ accessToken: string }>>("/citizen/auth/refresh", {
          refreshToken: currentSession?.refreshToken,
        });
        const accessToken = res.data.data.accessToken;
        if (currentSession) await persist({ ...currentSession, accessToken });
        return accessToken;
      } catch {
        await persist(null);
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

// Attaches the citizen bearer token to every request once logged in, and
// transparently refreshes+retries once on a 401 before giving up — the
// admin dashboard has an equivalent access/refresh split but uses browser
// cookies for the refresh leg; mobile has no shared cookie jar across app
// restarts, so the refresh token travels in the request body instead
// (backend/src/modules/citizenAuth/citizenAuth.routes.ts accepts both).
api.interceptors.request.use((config) => {
  if (currentSession) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${currentSession.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && currentSession && original && !original._retried) {
      original._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);
