"use client";

import { useEffect } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { getMyPayments, type MyPaymentsQuery } from "@/lib/api/payment";
import { plainPaymentError } from "@/lib/payment-labels";

export const paymentsKey = (params?: unknown) =>
  params === undefined ? (["payments", "mine"] as const) : (["payments", "mine", params] as const);

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useMyPayments(query: MyPaymentsQuery) {
  const result = useQuery({
    queryKey: paymentsKey(query),
    queryFn: () => getMyPayments(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(plainPaymentError(result.error));
  }, [result.error]);
  return result;
}
