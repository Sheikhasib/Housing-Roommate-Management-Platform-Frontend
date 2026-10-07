"use client";

import { useQuery } from "@tanstack/react-query";

import { getGateways } from "@/lib/api/payment";

export const GATEWAYS_QUERY_KEY = ["payment", "gateways"] as const;

/** The enabled gateways from the backend. It changes only with the backend env, so it is cached for a while. */
export function useGateways() {
  return useQuery({
    queryKey: GATEWAYS_QUERY_KEY,
    queryFn: getGateways,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
