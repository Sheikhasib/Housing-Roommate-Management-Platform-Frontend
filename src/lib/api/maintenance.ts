import { apiClient } from "@/lib/api/apiClient";
import { uploadWithProgress } from "@/lib/api/upload";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { TenantMaintenanceRequest } from "@/types/maintenance";
import type { CreateMaintenancePayload } from "@/validation/maintenance";

export interface MyRequestsQuery {
  page: number;
  limit: number;
  status?: string;
}

export interface MyRequestsResult {
  rows: TenantMaintenanceRequest[];
  meta: ApiMeta;
}

/** The tenant's own maintenance requests, newest first (the backend decides the order). */
export async function getMyRequests(query: MyRequestsQuery): Promise<MyRequestsResult> {
  const { page, limit, status } = query;
  const response = await apiClient<ApiSuccess<TenantMaintenanceRequest[]>>(
    "/maintenance/my-requests",
    { query: { page, limit, ...(status ? { status } : {}) } },
  );
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

export function createMaintenanceRequest(body: CreateMaintenancePayload) {
  return apiClient<ApiSuccess<TenantMaintenanceRequest>>("/maintenance", {
    method: "POST",
    body,
  });
}

/** Attaches one photo (field `image`). A second upload replaces the first. */
export function uploadRequestPhoto(
  requestId: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const formData = new FormData();
  formData.append("image", file);
  return uploadWithProgress<TenantMaintenanceRequest>(
    `/maintenance/${encodeURIComponent(requestId)}/image`,
    formData,
    { method: "POST", onProgress },
  );
}

export function requestPhotoUrl(requestId: string): string {
  return `/maintenance/${encodeURIComponent(requestId)}/image`;
}
