import { apiClient } from "@/lib/api/apiClient";
import type { AdminUser, OwnerVerificationRow, TenantVerificationRow } from "@/types/admin";
import type { ApiMeta, ApiSuccess } from "@/types/api";

export interface ListResult<T> {
  rows: T[];
  meta: ApiMeta;
}

type QueryValue = string | number | undefined;

/** Drops empty values so they never reach the backend as `?role=`. */
function clean(query: Record<string, QueryValue>): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") result[key] = value;
  }
  return result;
}

async function list<T>(path: string, query: Record<string, QueryValue>): Promise<ListResult<T>> {
  const response = await apiClient<ApiSuccess<T[]>>(path, { query: clean(query) });
  const rows = response.data;
  return {
    rows,
    meta: response.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export interface UsersQuery {
  page: number;
  limit: number;
  searchTerm: string;
  role: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function getAdminUsers(query: UsersQuery) {
  return list<AdminUser>("/admin/users", { ...query });
}

export function updateUserStatus(userId: string, body: { status: "ACTIVE" | "BLOCKED"; reason?: string }) {
  return apiClient<ApiSuccess<unknown>>(`/admin/users/${userId}/status`, { method: "PATCH", body });
}

export function updateUserRole(userId: string, body: { role: string; reason?: string }) {
  return apiClient<ApiSuccess<unknown>>(`/admin/users/${userId}/role`, { method: "PATCH", body });
}

export interface VerificationQuery {
  page: number;
  limit: number;
  searchTerm: string;
}

export function getTenantVerifications(query: VerificationQuery) {
  return list<TenantVerificationRow>("/admin/tenant-verifications", { ...query });
}

export function getOwnerVerifications(query: VerificationQuery & { verificationStatus: string }) {
  return list<OwnerVerificationRow>("/owner/all-owners", { ...query });
}

export interface ReviewBody {
  verificationStatus: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export function reviewTenant(tenantProfileId: string, body: ReviewBody) {
  return apiClient<ApiSuccess<unknown>>(`/admin/tenant-verifications/${tenantProfileId}`, {
    method: "PATCH",
    body,
  });
}

export function reviewOwner(ownerProfileId: string, body: ReviewBody) {
  return apiClient<ApiSuccess<unknown>>("/owner/verify", {
    method: "PATCH",
    body: { ownerProfileId, ...body },
  });
}
