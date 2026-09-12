import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, Paginated } from "./client";
import { Department, Grievance, GrievanceActivity, GrievanceCategory, GrievanceDashboardStats, GrievancePriority, GrievanceSlaConfig, Officer } from "@/types/grievance";

export interface GrievanceListParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  subCategory?: string;
  ward?: string;
  area?: string;
  department?: string;
  assignedOfficer?: string;
  from?: string;
  to?: string;
  q?: string;
}

export function useGrievancesList(params: GrievanceListParams) {
  return useQuery({
    queryKey: ["grievances", "list", params],
    queryFn: async () => (await api.get<ApiEnvelope<Paginated<Grievance>>>("/admin/grievances", { params })).data.data,
  });
}

// Dashboard numbers must always reflect the same filters as the list
// they sit above (§30/§56 of the spec) — same params shape, different path.
export function useGrievanceDashboard(params: Omit<GrievanceListParams, "page" | "limit" | "q" | "status">) {
  return useQuery({
    queryKey: ["grievances", "dashboard", params],
    queryFn: async () => (await api.get<ApiEnvelope<GrievanceDashboardStats>>("/admin/grievances/dashboard", { params })).data.data,
  });
}

export function useGrievanceDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["grievances", "detail", id],
    queryFn: async () => (await api.get<ApiEnvelope<Grievance>>(`/admin/grievances/${id}`)).data.data,
    enabled: !!id,
  });
}

export function useGrievanceTimeline(id: string | undefined) {
  return useQuery({
    queryKey: ["grievances", "timeline", id],
    queryFn: async () => (await api.get<ApiEnvelope<GrievanceActivity[]>>(`/admin/grievances/${id}/timeline`)).data.data,
    enabled: !!id,
  });
}

function useGrievanceAction<TPayload>(id: string, path: string, method: "post" | "patch" = "post") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TPayload) => (await api[method]<ApiEnvelope<Grievance>>(`/admin/grievances/${id}${path}`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grievances", "detail", id] });
      qc.invalidateQueries({ queryKey: ["grievances", "timeline", id] });
      qc.invalidateQueries({ queryKey: ["grievances", "list"] });
      qc.invalidateQueries({ queryKey: ["grievances", "dashboard"] });
    },
  });
}

export interface AssignPayload {
  department: string;
  assignedOfficer?: string;
  dueDate?: string;
  internalNote?: string;
}
export const useAssignGrievance = (id: string) => useGrievanceAction<AssignPayload>(id, "/assign");

export interface PriorityChangePayload {
  priority: GrievancePriority;
  reason: string;
}
export const useChangeGrievancePriority = (id: string) => useGrievanceAction<PriorityChangePayload>(id, "/priority", "patch");

export interface StatusChangePayload {
  status: string;
  note?: string;
}
export const useChangeGrievanceStatus = (id: string) => useGrievanceAction<StatusChangePayload>(id, "/status", "patch");

export interface ResolvePayload {
  resolutionDescription: string;
  resolutionAttachments?: Array<{ url: string; thumbnailUrl?: string; mediumUrl?: string; fileName: string; fileType: string }>;
}
export const useResolveGrievance = (id: string) => useGrievanceAction<ResolvePayload>(id, "/resolve");

export interface RejectPayload {
  rejectionReason: string;
}
export const useRejectGrievance = (id: string) => useGrievanceAction<RejectPayload>(id, "/reject");

export interface CommentPayload {
  message: string;
  isPublic: boolean;
}
// Unlike the other actions, /comments returns {added: true} rather than the
// updated grievance — the grievance document itself doesn't change, only
// its timeline does, so useGrievanceAction's Grievance-typed response
// doesn't fit here.
export function useAddGrievanceComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CommentPayload) => (await api.post<ApiEnvelope<{ added: boolean }>>(`/admin/grievances/${id}/comments`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grievances", "timeline", id] });
    },
  });
}

// --- Reference data (categories, departments, officers, SLA config) ---

export function useGrievanceCategoriesAdmin() {
  return useQuery({
    queryKey: ["grievance-categories-admin"],
    queryFn: async () => (await api.get<ApiEnvelope<GrievanceCategory[]>>("/admin/grievance-categories")).data.data,
    staleTime: 5 * 60_000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["grievance-departments"],
    queryFn: async () => (await api.get<ApiEnvelope<Department[]>>("/admin/grievance-departments")).data.data,
    staleTime: 5 * 60_000,
  });
}

export function useOfficers(departmentId?: string) {
  return useQuery({
    queryKey: ["grievance-officers", departmentId],
    queryFn: async () => (await api.get<ApiEnvelope<Officer[]>>("/admin/grievance-officers", { params: departmentId ? { department: departmentId } : {} })).data.data,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: { en: string; te: string } }) => (await api.post<ApiEnvelope<Department>>("/admin/grievance-departments", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grievance-departments"] }),
  });
}

export function useCreateOfficer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; mobile?: string; department: string }) => (await api.post<ApiEnvelope<Officer>>("/admin/grievance-officers", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grievance-officers"] }),
  });
}

export function useGrievanceSlaConfig() {
  return useQuery({
    queryKey: ["grievance-sla-config"],
    queryFn: async () => (await api.get<ApiEnvelope<GrievanceSlaConfig>>("/admin/grievance-sla-config")).data.data,
  });
}

export function useUpdateGrievanceSlaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GrievanceSlaConfig) => (await api.put<ApiEnvelope<GrievanceSlaConfig>>("/admin/grievance-sla-config", payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grievance-sla-config"] }),
  });
}
