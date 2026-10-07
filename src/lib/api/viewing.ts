import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { OwnerViewing, TenantViewing, Viewing } from "@/types/viewing";
import type { UpdateViewingStatusPayload, ViewingPayload } from "@/validation/viewing";

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

export interface OwnerViewingsQuery {
  page: number;
  limit: number;
  status?: string;
  roomId?: string;
}

export interface OwnerViewingsResult {
  rows: OwnerViewing[];
  meta: ApiMeta;
}

/** Requests for the owner's rooms, or a manager's assigned properties. The server scopes by role. */
export async function getOwnerViewings(query: OwnerViewingsQuery): Promise<OwnerViewingsResult> {
  const { page, limit, status, roomId } = query;
  const response = await apiClient<ApiSuccess<OwnerViewing[]>>("/viewing/owner-requests", {
    query: { page, limit, ...(status ? { status } : {}), ...(roomId ? { roomId } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

/** Body is already parsed by the status schema. */
export function updateViewingStatus(viewingId: string, body: UpdateViewingStatusPayload) {
  return apiClient<ApiSuccess<Viewing>>(`/viewing/${encodeURIComponent(viewingId)}/status`, {
    method: "PATCH",
    body,
  });
}

export function cancelViewing(viewingId: string) {
  return apiClient<ApiSuccess<Viewing>>(`/viewing/${encodeURIComponent(viewingId)}/cancel`, {
    method: "POST",
  });
}
