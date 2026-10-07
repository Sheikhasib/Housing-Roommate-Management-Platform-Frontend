import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { TenantLease, TerminateLeaseResult } from "@/types/lease";
import type { TerminateLeasePayload } from "@/validation/lease";

export interface MyLeasesQuery {
  page: number;
  limit: number;
  status?: string;
}

export interface MyLeasesResult {
  rows: TenantLease[];
  meta: ApiMeta;
}

export async function getMyLeases(query: MyLeasesQuery): Promise<MyLeasesResult> {
  const { page, limit, status } = query;
  const response = await apiClient<ApiSuccess<TenantLease[]>>("/lease/my-leases", {
    query: { page, limit, ...(status ? { status } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

export async function getLease(leaseId: string): Promise<TenantLease> {
  const response = await apiClient<ApiSuccess<TenantLease>>(`/lease/${encodeURIComponent(leaseId)}`);
  return response.data;
}

export function terminateLease(leaseId: string, body: TerminateLeasePayload) {
  return apiClient<ApiSuccess<TerminateLeaseResult>>(
    `/lease/${encodeURIComponent(leaseId)}/terminate`,
    { method: "POST", body },
  );
}
