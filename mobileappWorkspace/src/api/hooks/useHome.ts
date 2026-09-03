import { useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/api/client";
import { HomeData } from "@/types";

export function useHome() {
  return useQuery({
    queryKey: ["home"],
    queryFn: async () => (await api.get<ApiEnvelope<HomeData>>("/home")).data.data,
    staleTime: 60_000, // matches the API's own 60s edge cache (docs/API.md)
  });
}
