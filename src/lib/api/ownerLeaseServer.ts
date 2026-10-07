import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { OwnerLeaseDetail } from "@/types/lease";

/** Lease detail for the room owner or an assigned manager, read with the user token. */
export async function getLeaseForOwnerSide(leaseId: string): Promise<OwnerLeaseDetail> {
  const response = await serverApi<ApiSuccess<OwnerLeaseDetail>>(
    `/lease/${encodeURIComponent(leaseId)}`,
  );
  return response.data;
}
