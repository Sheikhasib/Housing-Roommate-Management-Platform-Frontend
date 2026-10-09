import { serverGuestApi } from "@/lib/api/serverApi";
import type { ApiSuccess, Paginated } from "@/types/api";
import type { PublicPropertyDetail, PublicPropertySummary } from "@/types/property";
import type { PropertyLocation } from "@/types/room";
import type { PropertiesFilters } from "@/validation/properties-filter";

/** Map fields of a property (guest view). Fail-soft: any error means "no location data". */
export async function getPropertyLocation(propertyId: string): Promise<PropertyLocation | null> {
  try {
    const { data } = await serverGuestApi<ApiSuccess<PropertyLocation>>(
      `/property/${encodeURIComponent(propertyId)}`,
    );
    return data;
  } catch {
    return null;
  }
}

/** Guest view of properties that have a published room (`GET /property/public`). */
export function getPublicProperties(
  filters: PropertiesFilters,
): Promise<Paginated<PublicPropertySummary>> {
  const query: Record<string, string | number> = {
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.searchTerm) query.searchTerm = filters.searchTerm;
  if (filters.city) query.city = filters.city;
  if (filters.type) query.type = filters.type;

  return serverGuestApi<Paginated<PublicPropertySummary>>("/property/public", { query });
}

/** Guest view of one property. Throws ApiError (404 when it does not exist or was deleted). */
export async function getPublicPropertyById(propertyId: string): Promise<PublicPropertyDetail> {
  const { data } = await serverGuestApi<ApiSuccess<PublicPropertyDetail>>(
    `/property/${encodeURIComponent(propertyId)}`,
  );
  return data;
}
