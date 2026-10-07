"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { cancelViewing, getMyViewings, type MyViewingsQuery } from "@/lib/api/viewing";

export const viewingsKey = (params?: unknown) =>
  params === undefined ? (["viewings", "mine"] as const) : (["viewings", "mine", params] as const);

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useMyViewings(query: MyViewingsQuery) {
  const result = useQuery({
    queryKey: viewingsKey(query),
    queryFn: () => getMyViewings(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(errorMessage(result.error));
  }, [result.error]);
  return result;
}

/** Refetches every viewing list (tenant and owner) after a change. */
export function useRefreshViewings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["viewings"] });
}

/** Not optimistic: the server may refuse a cancel (403 or 409) and its message is shown as it is. */
export function useCancelViewing() {
  const refresh = useRefreshViewings();
  return useMutation({
    mutationFn: (viewingId: string) => cancelViewing(viewingId),
    // A refused cancel usually means the request changed meanwhile, so the list reloads either way.
    onSettled: refresh,
  });
}
