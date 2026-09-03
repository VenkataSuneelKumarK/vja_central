import { useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/api/client";

export function useDetail<T>(path: string, id: string | undefined) {
  return useQuery({
    queryKey: [path, id],
    queryFn: async () => (await api.get<ApiEnvelope<T>>(`${path}/${id}`)).data.data,
    enabled: !!id,
  });
}
