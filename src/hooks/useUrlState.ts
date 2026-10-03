"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseUrlStateOptions {
  defaultLimit?: number;
}

export type UrlStateUpdate = Record<string, string | number | null | undefined>;

export function useUrlState({ defaultLimit = 10 }: UseUrlStateOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || defaultLimit);
  const searchTerm = searchParams.get("searchTerm") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "";
  const sortOrder: "asc" | "desc" = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  /** Sets or clears keys (null, undefined or "" removes). Any change that does not set `page` resets page to 1. */
  const setParams = useCallback(
    (updates: UrlStateUpdate) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      if (!("page" in updates)) next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const getParam = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams]);

  return { page, limit, searchTerm, sortBy, sortOrder, getParam, setParams };
}
