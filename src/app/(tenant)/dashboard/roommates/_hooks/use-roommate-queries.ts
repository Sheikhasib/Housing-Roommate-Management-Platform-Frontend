"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import {
  getMyRoommateRequests,
  getRoommateMatches,
  respondToRoommateRequest,
  sendRoommateRequest,
  type MyRequestsQuery,
} from "@/lib/api/roommate";
import type { RespondRoommatePayload, SendRoommatePayload } from "@/validation/roommate";

export const matchesKey = ["roommate", "matches"] as const;
export const requestsKey = (params?: unknown) =>
  params === undefined ? (["roommate", "requests"] as const) : (["roommate", "requests", params] as const);

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

function useErrorToast(error: unknown) {
  useEffect(() => {
    if (error) toast.error(errorMessage(error));
  }, [error]);
}

/** `enabled` stays false while matching is off, so the server is not asked. */
export function useRoommateMatches(enabled: boolean) {
  const result = useQuery({
    queryKey: matchesKey,
    queryFn: getRoommateMatches,
    enabled,
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

export function useMyRoommateRequests(query: MyRequestsQuery) {
  const result = useQuery({
    queryKey: requestsKey(query),
    queryFn: () => getMyRoommateRequests(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

/** Not optimistic: the server may refuse (400, 404 or 409) and its message is shown as it is. */
export function useSendRoommateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SendRoommatePayload) => sendRoommateRequest(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestsKey() });
      void queryClient.invalidateQueries({ queryKey: matchesKey });
    },
  });
}

export function useRespondRoommateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, body }: { requestId: string; body: RespondRoommatePayload }) =>
      respondToRoommateRequest(requestId, body),
    // A refused answer (403 or 409) usually means the request changed meanwhile, so lists reload either way.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: requestsKey() });
      void queryClient.invalidateQueries({ queryKey: ["roommate", "pairs"] });
    },
  });
}
