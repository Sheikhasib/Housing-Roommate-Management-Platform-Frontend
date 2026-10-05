"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ME_QUERY_KEY } from "@/hooks/useGetMe";
import { getManagerProfile, getOwnerProfile, getTenantProfile } from "@/lib/api/profile";

export const TENANT_QUERY_KEY = ["tenant", "me"] as const;
export const OWNER_QUERY_KEY = ["owner", "me"] as const;
export const MANAGER_QUERY_KEY = ["manager", "me"] as const;

const QUERY_OPTIONS = { staleTime: 60 * 1000, retry: false, refetchOnWindowFocus: false } as const;

export function useTenantProfile(enabled: boolean) {
  return useQuery({ queryKey: TENANT_QUERY_KEY, queryFn: getTenantProfile, enabled, ...QUERY_OPTIONS });
}

export function useOwnerProfile(enabled: boolean) {
  return useQuery({ queryKey: OWNER_QUERY_KEY, queryFn: getOwnerProfile, enabled, ...QUERY_OPTIONS });
}

export function useManagerProfile(enabled: boolean) {
  return useQuery({
    queryKey: MANAGER_QUERY_KEY,
    queryFn: getManagerProfile,
    enabled,
    ...QUERY_OPTIONS,
  });
}

/** Every successful profile mutation refreshes the session user and its role profile. */
export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return (roleKey?: readonly string[]) => {
    void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    if (roleKey) void queryClient.invalidateQueries({ queryKey: roleKey });
  };
}
