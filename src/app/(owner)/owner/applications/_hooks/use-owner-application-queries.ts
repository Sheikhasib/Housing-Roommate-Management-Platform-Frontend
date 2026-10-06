"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import {
  getOwnerApplication,
  getOwnerApplications,
  reviewApplication,
  type OwnerApplicationsQuery,
} from "@/lib/api/ownerApplication";
import type { OwnerApplicationDetail } from "@/types/owner-application";
import type { ReviewPayload } from "@/validation/application";

export const ownerApplicationsKey = (params?: unknown) =>
  params === undefined
    ? (["applications", "owner"] as const)
    : (["applications", "owner", params] as const);
export const ownerApplicationKey = (id: string) => ["application", "owner", id] as const;

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useOwnerApplications(query: OwnerApplicationsQuery, enabled: boolean) {
  const result = useQuery({
    queryKey: ownerApplicationsKey(query),
    queryFn: () => getOwnerApplications(query),
    enabled,
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(errorMessage(result.error));
  }, [result.error]);
  return result;
}

/** The server page already loaded the application; the query keeps it fresh after a decision. */
export function useOwnerApplication(applicationId: string, initialData: OwnerApplicationDetail) {
  return useQuery({
    queryKey: ownerApplicationKey(applicationId),
    queryFn: () => getOwnerApplication(applicationId),
    initialData,
    staleTime: 30 * 1000,
    ...OPTIONS,
  });
}

/** Not optimistic: the backend may refuse a decision (409 or 403), and its message is shown as it is. */
export function useReviewApplication(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReviewPayload) => reviewApplication(applicationId, body),
    // Refetch on failure too: a 409 usually means the application changed under the page.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ownerApplicationKey(applicationId) });
      void queryClient.invalidateQueries({ queryKey: ownerApplicationsKey() });
    },
  });
}
