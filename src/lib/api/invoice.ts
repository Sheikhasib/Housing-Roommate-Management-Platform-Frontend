import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { TenantInvoice } from "@/types/invoice";

export interface MyInvoicesQuery {
  page: number;
  limit: number;
  status?: string;
  type?: string;
}

export interface MyInvoicesResult {
  rows: TenantInvoice[];
  meta: ApiMeta;
}

/** The tenant's own invoices, newest period first (the backend decides the order). */
export async function getMyInvoices(query: MyInvoicesQuery): Promise<MyInvoicesResult> {
  const { page, limit, status, type } = query;
  const response = await apiClient<ApiSuccess<TenantInvoice[]>>("/invoice/my-invoices", {
    query: { page, limit, ...(status ? { status } : {}), ...(type ? { type } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}
