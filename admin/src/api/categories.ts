import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { Category, ContentType } from "@/types";

export function useCategories(appliesTo?: ContentType) {
  return useQuery({
    queryKey: ["categories", "admin", appliesTo],
    queryFn: async () => (await api.get<{ data: Category[] }>("/admin/categories")).data.data,
    select: (categories) => (appliesTo ? categories.filter((c) => c.appliesTo.includes(appliesTo)) : categories),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: { en: string; te: string }; slug: string; appliesTo: ContentType[] }) =>
      (await api.post<{ data: Category }>("/admin/categories", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
