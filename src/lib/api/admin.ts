import { ApiError } from "@/lib/api/apiError";
import { serverApi } from "@/lib/api/serverApi";
import type { AdminDashboardStats, LoadResult } from "@/types/admin";
import type { ApiSuccess } from "@/types/api";

function failure(error: unknown): { ok: false; message: string } {
  if (error instanceof ApiError) {
    return { ok: false, message: error.errors[0]?.message || error.message };
  }
  return { ok: false, message: "We could not load this. Check your connection and try again." };
}

export async function getAdminDashboardStats(): Promise<LoadResult<AdminDashboardStats>> {
  try {
    const response = await serverApi<ApiSuccess<AdminDashboardStats>>("/admin/dashboard-stats");
    return { ok: true, data: response.data };
  } catch (error) {
    return failure(error);
  }
}

/** The stats endpoint has no refund counter, so read the total from the list meta. */
export async function getPendingRefundCount(): Promise<LoadResult<number>> {
  try {
    const response = await serverApi<ApiSuccess<unknown[]>>("/admin/payments/pending-refunds", {
      query: { page: 1, limit: 1 },
    });
    return { ok: true, data: response.meta?.total ?? response.data.length };
  } catch (error) {
    return failure(error);
  }
}
