"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import {
  createUtilityBill,
  getRoomInvoices,
  type RoomInvoicesQuery,
} from "@/lib/api/ownerInvoice";
import type { CreateUtilityBillPayload } from "@/validation/invoice";

export const ownerInvoicesKey = (params?: unknown) =>
  params === undefined
    ? (["invoices", "owner"] as const)
    : (["invoices", "owner", params] as const);

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

/** Runs only when a room is picked. */
export function useRoomInvoices(query: RoomInvoicesQuery, enabled: boolean) {
  const result = useQuery({
    queryKey: ownerInvoicesKey(query),
    queryFn: () => getRoomInvoices(query),
    enabled: enabled && Boolean(query.roomId),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(errorMessage(result.error));
  }, [result.error]);
  return result;
}

/** Not optimistic: the bill is split on the server. The lists refresh once it succeeds. */
export function useCreateUtilityBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUtilityBillPayload) => createUtilityBill(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ownerInvoicesKey() }),
  });
}
