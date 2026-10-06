import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { OwnerApplicationDetail } from "@/types/owner-application";

/** Application detail for the room owner or an assigned manager, read with the user token. */
export async function getApplicationForOwnerSide(
  applicationId: string,
): Promise<OwnerApplicationDetail> {
  const response = await serverApi<ApiSuccess<OwnerApplicationDetail>>(
    `/application/${encodeURIComponent(applicationId)}`,
  );
  return response.data;
}
