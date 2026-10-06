"use client";

import { useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/apiError";
import {
  getOwnedProperties,
  getPropertyDetail,
  getPropertyManagers,
  type OwnedPropertiesQuery,
} from "@/lib/api/ownerProperty";
import type { PropertyDetail } from "@/types/property";

export const propertiesKey = (params?: unknown) =>
  params === undefined ? (["properties", "mine"] as const) : (["properties", "mine", params] as const);
export const propertyKey = (id: string) => ["property", id] as const;
export const propertyManagersKey = (id: string) => ["property", id, "managers"] as const;

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.errors[0]?.message || error.message;
  return "Something went wrong. Try again";
}

/** One toast per failed load. */
function useErrorToast(error: unknown) {
  useEffect(() => {
    if (error) toast.error(errorMessage(error));
  }, [error]);
}

export function useOwnedProperties(isManager: boolean, enabled: boolean, query: OwnedPropertiesQuery) {
  const result = useQuery({
    queryKey: [...propertiesKey(query), isManager],
    queryFn: () => getOwnedProperties(isManager, query),
    enabled,
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

/** The server page already loaded the property; the query keeps it fresh after edits. */
export function useProperty(propertyId: string, initialData: PropertyDetail) {
  return useQuery({
    queryKey: propertyKey(propertyId),
    queryFn: () => getPropertyDetail(propertyId),
    initialData,
    staleTime: 30 * 1000,
    ...OPTIONS,
  });
}

export function usePropertyManagers(propertyId: string) {
  const result = useQuery({
    queryKey: propertyManagersKey(propertyId),
    queryFn: () => getPropertyManagers(propertyId),
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

/** After a change: refetch this property and every list that shows it. */
export function useRefreshProperty(propertyId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: propertyKey(propertyId) });
    void queryClient.invalidateQueries({ queryKey: propertiesKey() });
  };
}
