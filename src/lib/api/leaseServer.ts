import { getApplicationForTenant } from "@/lib/api/applicationServer";
import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { TenantLease } from "@/types/lease";

/** Lease detail, read with the user's token. The backend answers 403 for a lease that is not theirs. */
export async function getLeaseForTenant(leaseId: string): Promise<TenantLease> {
  const response = await serverApi<ApiSuccess<TenantLease>>(`/lease/${encodeURIComponent(leaseId)}`);
  return response.data;
}

/**
 * The lease id created by an application's deposit payment, or null when it is not available
 * (no lease yet, not the tenant's application, or the read failed). The caller falls back.
 */
export async function findLeaseIdForApplication(applicationId: string): Promise<string | null> {
  try {
    return (await getApplicationForTenant(applicationId)).lease?.id ?? null;
  } catch {
    return null;
  }
}
