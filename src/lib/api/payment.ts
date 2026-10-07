import { apiClient } from "@/lib/api/apiClient";
import type { ApiSuccess } from "@/types/api";
import type { GatewaysResponse } from "@/types/payment";

/** The gateways the backend has enabled. Public endpoint; the list is never hard-coded. */
export async function getGateways(): Promise<string[]> {
  const response = await apiClient<ApiSuccess<GatewaysResponse>>("/payment/gateways");
  return response.data.gateways;
}
