"use client";

import { useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getMyInvoices, type MyInvoicesQuery } from "@/lib/api/invoice";
import { plainPaymentError } from "@/lib/payment-labels";

export const invoicesKey = (params?: unknown) =>
  params === undefined ? (["invoices", "mine"] as const) : (["invoices", "mine", params] as const);

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useMyInvoices(query: MyInvoicesQuery) {
  const result = useQuery({
    queryKey: invoicesKey(query),
    queryFn: () => getMyInvoices(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(plainPaymentError(result.error));
  }, [result.error]);
  return result;
}

/** After a payment state may have changed: refetch the invoice lists and the payment history. */
export function useRefreshInvoices() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: invoicesKey() });
    void queryClient.invalidateQueries({ queryKey: ["payments", "mine"] });
  };
}
