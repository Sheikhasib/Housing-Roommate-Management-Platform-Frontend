import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { OwnerInvoiceRow } from "@/types/invoice";
import type { CreateUtilityBillPayload } from "@/validation/invoice";

export interface RoomInvoicesQuery {
  roomId: string;
  page: number;
  limit: number;
  status?: string;
  type?: string;
}

export interface RoomInvoicesResult {
  rows: OwnerInvoiceRow[];
  meta: ApiMeta;
}

export async function getRoomInvoices(query: RoomInvoicesQuery): Promise<RoomInvoicesResult> {
  const { roomId, page, limit, status, type } = query;
  const response = await apiClient<ApiSuccess<OwnerInvoiceRow[]>>(
    `/invoice/room/${encodeURIComponent(roomId)}`,
    { query: { page, limit, ...(status ? { status } : {}), ...(type ? { type } : {}) } },
  );
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

/** Body is already parsed by CreateUtilityBillZodSchema. */
export function createUtilityBill(body: CreateUtilityBillPayload) {
  return apiClient<ApiSuccess<OwnerInvoiceRow[]>>("/invoice/utility-bill", {
    method: "POST",
    body,
  });
}
