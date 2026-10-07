import { ApiError } from "@/lib/api/apiError";
import { serverApi } from "@/lib/api/serverApi";
import type { LoadResult } from "@/types/admin";
import type { ManagerAnalytics, OwnerAnalytics } from "@/types/analytics";
import type { ApiSuccess } from "@/types/api";

function failure(error: unknown): { ok: false; message: string } {
  if (error instanceof ApiError) {
    return { ok: false, message: error.errors[0]?.message || error.message };
  }
  return { ok: false, message: "We could not load this. Check your connection and try again." };
}

export async function getOwnerAnalytics(): Promise<LoadResult<OwnerAnalytics>> {
  try {
    const response = await serverApi<ApiSuccess<OwnerAnalytics>>("/analytics/owner-analytics");
    return { ok: true, data: response.data };
  } catch (error) {
    return failure(error);
  }
}

export async function getManagerAnalytics(): Promise<LoadResult<ManagerAnalytics>> {
  try {
    const response = await serverApi<ApiSuccess<ManagerAnalytics>>("/analytics/manager-analytics");
    return { ok: true, data: response.data };
  } catch (error) {
    return failure(error);
  }
}
