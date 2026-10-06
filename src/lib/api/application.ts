import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { Application, TenantApplication } from "@/types/application";
import type { ApplyPayload } from "@/validation/application";

export interface MyApplicationsQuery {
  page: number;
  limit: number;
  status?: string;
}

export interface MyApplicationsResult {
  rows: TenantApplication[];
  meta: ApiMeta;
}

export function applyForRoom(body: ApplyPayload) {
  return apiClient<ApiSuccess<Application>>("/application/apply", { method: "POST", body });
}

export async function getMyApplications(query: MyApplicationsQuery): Promise<MyApplicationsResult> {
  const { page, limit, status } = query;
  const response = await apiClient<ApiSuccess<TenantApplication[]>>("/application/my-applications", {
    query: { page, limit, ...(status ? { status } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

export async function getApplication(applicationId: string): Promise<TenantApplication> {
  const response = await apiClient<ApiSuccess<TenantApplication>>(
    `/application/${encodeURIComponent(applicationId)}`,
  );
  return response.data;
}

export function cancelApplication(applicationId: string) {
  return apiClient<ApiSuccess<Application>>(
    `/application/${encodeURIComponent(applicationId)}/cancel`,
    { method: "POST" },
  );
}
