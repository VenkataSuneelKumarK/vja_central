import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, Paginated } from "./client";

interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  [key: string]: unknown;
}

// One hook factory reused by every content module's admin pages (Activities,
// Events, News, Albums, Videos, Announcements) — mirrors the backend's
// createCrudController so the same list/get/create/update/status/delete
// shape is available on the client without six near-identical hook files.
export function createResourceHooks<T extends { _id: string }>(basePath: string, queryKey: string) {
  function useList(params: ListParams = {}) {
    return useQuery({
      queryKey: [queryKey, "list", params],
      queryFn: async () => {
        const res = await api.get<ApiEnvelope<Paginated<T>>>(`${basePath}`, { params });
        return res.data.data;
      },
    });
  }

  function useGet(id: string | undefined) {
    return useQuery({
      queryKey: [queryKey, "detail", id],
      queryFn: async () => {
        const res = await api.get<ApiEnvelope<T>>(`${basePath}/${id}`);
        return res.data.data;
      },
      enabled: !!id,
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (payload: Partial<T>) => {
        const res = await api.post<ApiEnvelope<T>>(basePath, payload);
        return res.data.data;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey, "list"] }),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, payload }: { id: string; payload: Partial<T> }) => {
        const res = await api.put<ApiEnvelope<T>>(`${basePath}/${id}`, payload);
        return res.data.data;
      },
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({ queryKey: [queryKey, "list"] });
        qc.invalidateQueries({ queryKey: [queryKey, "detail", vars.id] });
      },
    });
  }

  function useUpdateStatus() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, status }: { id: string; status: string }) => {
        const res = await api.patch<ApiEnvelope<T>>(`${basePath}/${id}/status`, { status });
        return res.data.data;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`${basePath}/${id}`);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey, "list"] }),
    });
  }

  return { useList, useGet, useCreate, useUpdate, useUpdateStatus, useDelete };
}
