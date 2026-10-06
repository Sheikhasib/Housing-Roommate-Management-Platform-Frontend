import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { TenantApplication } from "@/types/application";

/** Application detail for the applicant, read with the user's token. */
export async function getApplicationForTenant(applicationId: string): Promise<TenantApplication> {
  const response = await serverApi<ApiSuccess<TenantApplication>>(
    `/application/${encodeURIComponent(applicationId)}`,
  );
  return response.data;
}
