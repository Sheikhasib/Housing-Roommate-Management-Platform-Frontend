import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { OwnerLeaseDetail, OwnerLeaseRow } from "@/types/lease";

export interface OwnerLeasesQuery {
  page: number;
  limit: number;
  status?: string;
  roomId?: string;
}

export interface OwnerLeasesResult {
  rows: OwnerLeaseRow[];
  meta: ApiMeta;
}

export async function getOwnerLeases(query: OwnerLeasesQuery): Promise<OwnerLeasesResult> {
  const { page, limit, status, roomId } = query;
  const response = await apiClient<ApiSuccess<OwnerLeaseRow[]>>("/lease/owner-leases", {
    query: { page, limit, ...(status ? { status } : {}), ...(roomId ? { roomId } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

export async function getOwnerLease(leaseId: string): Promise<OwnerLeaseDetail> {
  const response = await apiClient<ApiSuccess<OwnerLeaseDetail>>(
    `/lease/${encodeURIComponent(leaseId)}`,
  );
  return response.data;
}
