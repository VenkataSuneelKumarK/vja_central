import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/api/client";
import { Grievance, GrievanceActivity, GrievanceCategory, GrievancePriority, UploadedAttachment } from "@/types/grievance";

export type MyGrievancesFilter = "pending" | "completed" | "all";

// "My Grievances" itself deliberately reuses InfiniteContentList directly
// (backend's /grievances/my returns the same {items,page,limit,total,hasMore}
// envelope every other list endpoint does) rather than a bespoke hook here.

export function useGrievanceCategories() {
  return useQuery({
    queryKey: ["grievance-categories"],
    queryFn: async () => (await api.get<ApiEnvelope<GrievanceCategory[]>>("/grievance-categories")).data.data,
    staleTime: 10 * 60_000,
  });
}

export function useGrievanceDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["my-grievance", id],
    queryFn: async () => (await api.get<ApiEnvelope<Grievance>>(`/grievances/my/${id}`)).data.data,
    enabled: !!id,
  });
}

export function useGrievanceTimeline(id: string | undefined) {
  return useQuery({
    queryKey: ["my-grievance-timeline", id],
    queryFn: async () => (await api.get<ApiEnvelope<GrievanceActivity[]>>(`/grievances/my/${id}/timeline`)).data.data,
    enabled: !!id,
  });
}

export interface CreateGrievancePayload {
  heading: string;
  description: string;
  category: string;
  subCategory?: string;
  customCategoryNote?: string;
  priority: GrievancePriority;
  area?: string;
  ward?: string;
  landmark?: string;
  geo?: { lat?: number | null; lng?: number | null };
  attachments: Array<{ url: string; thumbnailUrl?: string; mediumUrl?: string; fileName: string; fileType: string }>;
}

export function useCreateGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateGrievancePayload) => (await api.post<ApiEnvelope<Grievance>>("/grievances", payload)).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-grievances"] }),
  });
}

export function useVerifyGrievance(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { resolved: boolean; reopenReason?: string }) =>
      (await api.post<ApiEnvelope<Grievance>>(`/grievances/my/${id}/verify`, payload)).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-grievance", id] });
      queryClient.invalidateQueries({ queryKey: ["my-grievance-timeline", id] });
      queryClient.invalidateQueries({ queryKey: ["my-grievances"] });
    },
  });
}

export function useSubmitGrievanceFeedback(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { rating: number; comment?: string }) =>
      (await api.post<ApiEnvelope<Grievance>>(`/grievances/my/${id}/feedback`, payload)).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-grievance", id] });
      queryClient.invalidateQueries({ queryKey: ["my-grievances"] });
    },
  });
}

// One image at a time keeps upload progress/errors attributable to a single
// file in the New Grievance form, rather than one opaque multi-file call.
export function useUploadGrievanceAttachment() {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; mimeType: string }) => {
      const form = new FormData();
      form.append("files", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
      const res = await api.post<ApiEnvelope<UploadedAttachment[]>>("/grievances/attachments", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data[0];
    },
  });
}
