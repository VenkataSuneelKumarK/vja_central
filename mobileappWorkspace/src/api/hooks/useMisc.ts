import { useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope, Paginated } from "@/api/client";
import { AppSettings, Category, Photo } from "@/types";

export function useAppSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => (await api.get<ApiEnvelope<AppSettings>>("/app-settings")).data.data,
    staleTime: 5 * 60_000,
  });
}

export function useCategories(appliesTo?: string) {
  return useQuery({
    queryKey: ["categories", appliesTo],
    queryFn: async () => (await api.get<ApiEnvelope<Category[]>>("/categories", { params: appliesTo ? { appliesTo } : {} })).data.data,
    staleTime: 5 * 60_000,
  });
}

export function useAlbumPhotos(albumId: string | undefined, page: number) {
  return useQuery({
    queryKey: ["album-photos", albumId, page],
    queryFn: async () => (await api.get<ApiEnvelope<Paginated<Photo>>>(`/albums/${albumId}/photos`, { params: { page, limit: 30 } })).data.data,
    enabled: !!albumId,
  });
}

export interface SearchResultGroup<T = unknown> {
  type: string;
  items: T[];
}

export function useSearch(query: string, type?: string) {
  return useQuery({
    queryKey: ["search", query, type],
    queryFn: async () => (await api.get<ApiEnvelope<SearchResultGroup[]>>("/search", { params: { q: query, ...(type ? { type } : {}) } })).data.data,
    enabled: query.trim().length > 1,
  });
}
