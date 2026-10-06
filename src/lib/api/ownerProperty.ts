import { apiClient } from "@/lib/api/apiClient";
import { uploadWithProgress } from "@/lib/api/upload";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { OwnedPropertySummary, PropertyDetail, PropertyManagerRow } from "@/types/property";
import type { CreatePropertyPayload, CreateUnitPayload } from "@/validation/property";

export interface OwnedPropertiesQuery {
  page: number;
  limit: number;
  /** Owners only: the manager endpoint has no city filter. */
  city?: string;
}

export interface OwnedPropertiesResult {
  rows: OwnedPropertySummary[];
  meta: ApiMeta;
}

/** OWNER reads `/property/my-properties`; PROPERTY_MANAGER reads the assigned ones from `/manager/my-properties`. */
export async function getOwnedProperties(
  isManager: boolean,
  { page, limit, city }: OwnedPropertiesQuery,
): Promise<OwnedPropertiesResult> {
  const response = await apiClient<ApiSuccess<OwnedPropertySummary[]>>(
    isManager ? "/manager/my-properties" : "/property/my-properties",
    { query: { page, limit, ...(!isManager && city ? { city } : {}) } },
  );
  const rows = response.data;
  return {
    rows,
    meta: response.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function getPropertyDetail(propertyId: string): Promise<PropertyDetail> {
  const response = await apiClient<ApiSuccess<PropertyDetail>>(
    `/property/${encodeURIComponent(propertyId)}`,
  );
  return response.data;
}

export function updateProperty(propertyId: string, body: Record<string, unknown>) {
  return apiClient<ApiSuccess<PropertyDetail>>(`/property/${encodeURIComponent(propertyId)}`, {
    method: "PATCH",
    body,
  });
}

export function deleteOwnProperty(propertyId: string) {
  return apiClient<ApiSuccess<unknown>>(`/property/${encodeURIComponent(propertyId)}`, {
    method: "DELETE",
  });
}

export function removePropertyImage(propertyId: string, publicId: string) {
  return apiClient<ApiSuccess<unknown>>(`/property/${encodeURIComponent(propertyId)}/images`, {
    method: "DELETE",
    body: { publicId },
  });
}

/** Body of both create endpoints is already parsed by the matching Zod schema. */
export function createProperty(body: CreatePropertyPayload) {
  return apiClient<ApiSuccess<{ id: string }>>("/property", { method: "POST", body });
}

/** Sends the picked files in one multipart request (field `images`, max 10) with progress. */
export function uploadPropertyImages(
  propertyId: string,
  files: readonly File[],
  onProgress: (percent: number) => void,
) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return uploadWithProgress<unknown>(
    `/property/${encodeURIComponent(propertyId)}/images`,
    formData,
    { onProgress },
  );
}

export function createUnit(propertyId: string, body: CreateUnitPayload) {
  return apiClient<ApiSuccess<{ id: string }>>(`/property/${encodeURIComponent(propertyId)}/units`, {
    method: "POST",
    body,
  });
}

export function updateUnit(unitId: string, body: Record<string, unknown>) {
  return apiClient<ApiSuccess<unknown>>(`/property/unit/${encodeURIComponent(unitId)}`, {
    method: "PATCH",
    body,
  });
}

export function deleteUnit(unitId: string) {
  return apiClient<ApiSuccess<unknown>>(`/property/unit/${encodeURIComponent(unitId)}`, {
    method: "DELETE",
  });
}

export async function getPropertyManagers(propertyId: string): Promise<PropertyManagerRow[]> {
  const response = await apiClient<ApiSuccess<PropertyManagerRow[]>>(
    `/property/${encodeURIComponent(propertyId)}/managers`,
  );
  return response.data;
}

export function assignManager(propertyId: string, managerEmail: string) {
  return apiClient<ApiSuccess<unknown>>(`/property/${encodeURIComponent(propertyId)}/managers`, {
    method: "POST",
    body: { managerEmail },
  });
}

export function removeManager(propertyId: string, managerId: string) {
  return apiClient<ApiSuccess<unknown>>(
    `/property/${encodeURIComponent(propertyId)}/managers/${encodeURIComponent(managerId)}`,
    { method: "DELETE" },
  );
}
