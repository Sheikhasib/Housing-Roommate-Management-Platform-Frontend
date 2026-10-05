import { apiClient } from "@/lib/api/apiClient";
import type { ApiSuccess } from "@/types/api";
import type {
  ManagerProfile,
  OwnerProfile,
  TenantProfile,
  UserSummary,
  VerificationDocument,
} from "@/types/profile";

// Mutations return the whole envelope so the UI can show the backend message as is.

export function updateAccountName(body: { name?: string }) {
  return apiClient<ApiSuccess<UserSummary>>("/user/update-me", { method: "PATCH", body });
}

export async function getTenantProfile(): Promise<TenantProfile> {
  const response = await apiClient<ApiSuccess<TenantProfile>>("/tenant/me");
  return response.data;
}

export function updateTenantProfile(body: object) {
  return apiClient<ApiSuccess<TenantProfile>>("/tenant/update-me", { method: "PATCH", body });
}

export async function getOwnerProfile(): Promise<OwnerProfile> {
  const response = await apiClient<ApiSuccess<OwnerProfile>>("/owner/me");
  return response.data;
}

export function updateOwnerProfile(body: object) {
  return apiClient<ApiSuccess<OwnerProfile>>("/owner/update-me", { method: "PATCH", body });
}

export function removeOwnerDocument(publicId: string) {
  return apiClient<ApiSuccess<VerificationDocument[]>>("/owner/verification-documents", {
    method: "DELETE",
    body: { publicId },
  });
}

export function requestOwnerVerification() {
  return apiClient<ApiSuccess<OwnerProfile>>("/owner/request-verification", { method: "POST" });
}

export async function getManagerProfile(): Promise<ManagerProfile> {
  const response = await apiClient<ApiSuccess<ManagerProfile>>("/manager/me");
  return response.data;
}

export function updateManagerProfile(body: object) {
  return apiClient<ApiSuccess<ManagerProfile>>("/manager/update-me", { method: "PATCH", body });
}
