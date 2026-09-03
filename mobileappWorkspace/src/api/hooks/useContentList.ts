import { useInfiniteQuery } from "@tanstack/react-query";
import { api, ApiEnvelope, Paginated } from "@/api/client";

// One infinite-scroll hook reused by every public list screen (Activities,
// Events, News, Announcements, Videos, Albums) — mirrors the backend's
// shared list-endpoint shape (docs/API.md) so pagination logic exists in
// exactly one place instead of six copies (§19: never load a whole list at
// once, always paginate).
export function useContentList<T>(path: string, params: Record<string, unknown> = {}, queryKey: unknown[] = [path, params]) {
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => (await api.get<ApiEnvelope<Paginated<T>>>(path, { params: { ...params, page: pageParam, limit: 20 } })).data.data,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

export function flattenPages<T>(pages: Paginated<T>[] | undefined): T[] {
  return pages?.flatMap((p) => p.items) ?? [];
}
