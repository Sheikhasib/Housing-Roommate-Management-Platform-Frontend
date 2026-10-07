"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { getLease, getMyLeases, terminateLease, type MyLeasesQuery } from "@/lib/api/lease";
import type { TenantLease } from "@/types/lease";
import type { TerminateLeasePayload } from "@/validation/lease";

export const leasesKey = (params?: unknown) =>
  params === undefined ? (["leases", "mine"] as const) : (["leases", "mine", params] as const);
export const leaseKey = (id: string) => ["lease", id] as const;

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useMyLeases(query: MyLeasesQuery) {
  const result = useQuery({
    queryKey: leasesKey(query),
    queryFn: () => getMyLeases(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(errorMessage(result.error));
  }, [result.error]);
  return result;
}

/** The server page already loaded the lease; the query keeps it fresh after a termination. */
export function useLease(leaseId: string, initialData: TenantLease) {
  return useQuery({
    queryKey: leaseKey(leaseId),
    queryFn: () => getLease(leaseId),
    initialData,
    staleTime: 30 * 1000,
    ...OPTIONS,
  });
}

/** After a change: refetch this lease and the list that shows it. */
export function useRefreshLeases(leaseId?: string) {
  const queryClient = useQueryClient();
  return () => {
    if (leaseId) void queryClient.invalidateQueries({ queryKey: leaseKey(leaseId) });
    void queryClient.invalidateQueries({ queryKey: leasesKey() });
  };
}

/** Not optimistic: the backend may refuse (403, 409, 502). It also refetches then, because the state may have moved. */
export function useTerminateLease(leaseId: string) {
  const refresh = useRefreshLeases(leaseId);
  return useMutation({
    mutationFn: (body: TerminateLeasePayload) => terminateLease(leaseId, body),
    onSettled: refresh,
  });
}
