"use client";

import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/lib/api/auth";

export const ME_QUERY_KEY = ["me"] as const;

export function useGetMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
