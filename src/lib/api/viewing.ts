import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { TenantViewing, Viewing } from "@/types/viewing";
import type { ViewingPayload } from "@/validation/viewing";

export interface MyViewingsQuery {
  page: number;
  limit: number;
  status?: string;
}

export interface MyViewingsResult {
  rows: TenantViewing[];
  meta: ApiMeta;
}

export function createViewing(body: ViewingPayload) {
  return apiClient<ApiSuccess<Viewing>>("/viewing", { method: "POST", body });
}

export async function getMyViewings(query: MyViewingsQuery): Promise<MyViewingsResult> {
  const { page, limit, status } = query;
  const response = await apiClient<ApiSuccess<TenantViewing[]>>("/viewing/my-requests", {
    query: { page, limit, ...(status ? { status } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

export function cancelViewing(viewingId: string) {
  return apiClient<ApiSuccess<Viewing>>(`/viewing/${encodeURIComponent(viewingId)}/cancel`, {
    method: "POST",
  });
}
