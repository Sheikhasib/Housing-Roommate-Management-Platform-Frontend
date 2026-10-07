import { ApiError } from "@/lib/api/apiError";
import { serverApi } from "@/lib/api/serverApi";
import type { LoadResult } from "@/types/admin";
import type { TenantAnalytics } from "@/types/analytics";
import type { ApiSuccess } from "@/types/api";
import type { TenantApplication } from "@/types/application";
import type { TenantInvoice } from "@/types/invoice";

/** Approved applications read for the "Pay deposit" actions. */
const APPLICATION_LIMIT = 10;
const INVOICE_LIMIT = 5;
const SETTLED_OR_REFUNDING: string[] = ["PAID", "REFUND_PENDING", "REFUNDED"];

function failure(error: unknown): { ok: false; message: string } {
  if (error instanceof ApiError) {
    return { ok: false, message: error.errors[0]?.message || error.message };
  }
  return { ok: false, message: "We could not load this. Check your connection and try again." };
}

export async function getTenantAnalytics(): Promise<LoadResult<TenantAnalytics>> {
  try {
    const response = await serverApi<ApiSuccess<TenantAnalytics>>("/analytics/tenant-analytics");
    return { ok: true, data: response.data };
  } catch (error) {
    return failure(error);
  }
}

/** Approved applications that still need a deposit: no lease yet and no settled payment. */
export async function getDepositActions(): Promise<LoadResult<TenantApplication[]>> {
  try {
    const response = await serverApi<ApiSuccess<TenantApplication[]>>("/application/my-applications", {
      query: { page: 1, limit: APPLICATION_LIMIT, status: "APPROVED" },
    });
    const waiting = response.data.filter(
      (application) =>
        !application.lease &&
        !(application.payment && SETTLED_OR_REFUNDING.includes(application.payment.status)),
    );
    return { ok: true, data: waiting };
  } catch (error) {
    return failure(error);
  }
}

export async function getUnpaidInvoices(): Promise<LoadResult<TenantInvoice[]>> {
  try {
    const response = await serverApi<ApiSuccess<TenantInvoice[]>>("/invoice/my-invoices", {
      query: { page: 1, limit: INVOICE_LIMIT, status: "UNPAID" },
    });
    return { ok: true, data: response.data };
  } catch (error) {
    return failure(error);
  }
}
