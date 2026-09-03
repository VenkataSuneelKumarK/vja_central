import axios, { AxiosError } from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {}, { withCredentials: true });
    const token: string = res.data.data.accessToken;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

// On a 401 (expired access token), attempt exactly one silent refresh using
// the httpOnly refresh cookie, then retry the original request. Concurrent
// 401s share a single in-flight refresh so we don't hammer the endpoint.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const token = await refreshPromise;
      refreshPromise = null;

      if (token) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { message: string; code: string };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}
