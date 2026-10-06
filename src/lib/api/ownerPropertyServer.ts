import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { PropertyDetail } from "@/types/property";

/** Full property view for the owning OWNER or an assigned manager, read with the user's token. */
export async function getPropertyForOwnerSide(propertyId: string): Promise<PropertyDetail> {
  const response = await serverApi<ApiSuccess<PropertyDetail>>(
    `/property/${encodeURIComponent(propertyId)}`,
  );
  return response.data;
}
