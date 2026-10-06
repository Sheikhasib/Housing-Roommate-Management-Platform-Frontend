"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import {
  cancelApplication,
  getApplication,
  getMyApplications,
  type MyApplicationsQuery,
} from "@/lib/api/application";
import type { TenantApplication } from "@/types/application";

export const applicationsKey = (params?: unknown) =>
  params === undefined
    ? (["applications", "mine"] as const)
    : (["applications", "mine", params] as const);
export const applicationKey = (id: string) => ["application", id] as const;

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useMyApplications(query: MyApplicationsQuery) {
  const result = useQuery({
    queryKey: applicationsKey(query),
    queryFn: () => getMyApplications(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(errorMessage(result.error));
  }, [result.error]);
  return result;
}

/** The server page already loaded the application; the query keeps it fresh after a cancel. */
export function useApplication(applicationId: string, initialData: TenantApplication) {
  return useQuery({
    queryKey: applicationKey(applicationId),
    queryFn: () => getApplication(applicationId),
    initialData,
    staleTime: 30 * 1000,
    ...OPTIONS,
  });
}

/** After a change: refetch this application and the list that shows it. */
export function useRefreshApplications(applicationId?: string) {
  const queryClient = useQueryClient();
  return () => {
    if (applicationId) void queryClient.invalidateQueries({ queryKey: applicationKey(applicationId) });
    void queryClient.invalidateQueries({ queryKey: applicationsKey() });
  };
}

/** Not optimistic: the backend may refuse a cancel (409), and its message is shown as it is. */
export function useCancelApplication(applicationId: string) {
  const refresh = useRefreshApplications(applicationId);
  return useMutation({
    mutationFn: () => cancelApplication(applicationId),
    onSuccess: refresh,
  });
}
