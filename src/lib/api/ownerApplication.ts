import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { Application } from "@/types/application";
import type { OwnerApplicationDetail, OwnerApplicationRow } from "@/types/owner-application";
import type { ReviewPayload } from "@/validation/application";

export interface OwnerApplicationsQuery {
  page: number;
  limit: number;
  status?: string;
  roomId?: string;
}

export interface OwnerApplicationsResult {
  rows: OwnerApplicationRow[];
  meta: ApiMeta;
}

export async function getOwnerApplications(
  query: OwnerApplicationsQuery,
): Promise<OwnerApplicationsResult> {
  const { page, limit, status, roomId } = query;
  const response = await apiClient<ApiSuccess<OwnerApplicationRow[]>>(
    "/application/owner-applications",
    {
      query: { page, limit, ...(status ? { status } : {}), ...(roomId ? { roomId } : {}) },
    },
  );
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

export async function getOwnerApplication(applicationId: string): Promise<OwnerApplicationDetail> {
  const response = await apiClient<ApiSuccess<OwnerApplicationDetail>>(
    `/application/${encodeURIComponent(applicationId)}`,
  );
  return response.data;
}

export function reviewApplication(applicationId: string, body: ReviewPayload) {
  return apiClient<ApiSuccess<Application>>(
    `/application/${encodeURIComponent(applicationId)}/review`,
    { method: "PATCH", body },
  );
}
