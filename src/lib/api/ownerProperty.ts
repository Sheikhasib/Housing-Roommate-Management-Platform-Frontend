import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { OwnedPropertySummary, PropertyDetail, PropertyManagerRow } from "@/types/property";

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
