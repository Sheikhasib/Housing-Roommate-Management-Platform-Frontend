import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { GatewaysResponse, Payment } from "@/types/payment";

/** The gateways the backend has enabled. Public endpoint; the list is never hard-coded. */
export async function getGateways(): Promise<string[]> {
  const response = await apiClient<ApiSuccess<GatewaysResponse>>("/payment/gateways");
  return response.data.gateways;
}

export interface MyPaymentsQuery {
  page: number;
  limit: number;
  status?: string;
  purpose?: string;
}

export interface MyPaymentsResult {
  rows: Payment[];
  meta: ApiMeta;
}

/** The tenant's own payment history, newest first. */
export async function getMyPayments(query: MyPaymentsQuery): Promise<MyPaymentsResult> {
  const { page, limit, status, purpose } = query;
  const response = await apiClient<ApiSuccess<Payment[]>>("/payment/my-payments", {
    query: { page, limit, ...(status ? { status } : {}), ...(purpose ? { purpose } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}
