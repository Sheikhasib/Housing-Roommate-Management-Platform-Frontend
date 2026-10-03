import { serverGuestApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { PropertyLocation } from "@/types/room";

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
