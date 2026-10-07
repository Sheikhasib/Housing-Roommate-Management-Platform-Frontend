"use client";

import { useEffect } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import {
  getOwnerLease,
  getOwnerLeases,
  type OwnerLeasesQuery,
} from "@/lib/api/ownerLease";
import type { OwnerLeaseDetail } from "@/types/lease";

export const ownerLeasesKey = (params?: unknown) =>
  params === undefined ? (["leases", "owner"] as const) : (["leases", "owner", params] as const);
export const ownerLeaseKey = (id: string) => ["lease", "owner", id] as const;

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useOwnerLeases(query: OwnerLeasesQuery, enabled: boolean) {
  const result = useQuery({
    queryKey: ownerLeasesKey(query),
    queryFn: () => getOwnerLeases(query),
    enabled,
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(errorMessage(result.error));
  }, [result.error]);
  return result;
}

/** The server page already loaded the lease; the query keeps it fresh after a termination. */
export function useOwnerLease(leaseId: string, initialData: OwnerLeaseDetail) {
  return useQuery({
    queryKey: ownerLeaseKey(leaseId),
    queryFn: () => getOwnerLease(leaseId),
    initialData,
    staleTime: 30 * 1000,
    ...OPTIONS,
  });
}
