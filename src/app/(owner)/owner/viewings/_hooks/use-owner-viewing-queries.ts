"use client";

import { useEffect } from "react";
import {
  keepPreviousData,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getOwnerViewings, updateViewingStatus, type OwnerViewingsQuery } from "@/lib/api/viewing";
import { plainViewingError } from "@/lib/viewing-labels";
import type { UpdateViewingStatusPayload } from "@/validation/viewing";

export const ownerViewingsKey = (params?: unknown) =>
  params === undefined ? (["viewings", "owner"] as const) : (["viewings", "owner", params] as const);

const decisionKey = (viewingId: string) => ["viewings", "decision", viewingId] as const;

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useOwnerViewings(query: OwnerViewingsQuery, enabled: boolean) {
  const result = useQuery({
    queryKey: ownerViewingsKey(query),
    queryFn: () => getOwnerViewings(query),
    enabled,
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(plainViewingError(result.error));
  }, [result.error]);
  return result;
}

/** Refetches every viewing list and the server-rendered overview counts. */
export function useRefreshOwnerViewings() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["viewings"] });
    router.refresh();
  };
}

/**
 * Not optimistic: the server decides whether the move is allowed. The list reloads whether it
 * worked or not, because a refusal usually means someone else changed the request first.
 */
export function useDecideViewing(viewingId: string) {
  const refresh = useRefreshOwnerViewings();
  return useMutation({
    mutationKey: decisionKey(viewingId),
    mutationFn: (body: UpdateViewingStatusPayload) => updateViewingStatus(viewingId, body),
    onSettled: refresh,
  });
}

/** True while any decision on this row is in flight. */
export function useIsDeciding(viewingId: string): boolean {
  return useIsMutating({ mutationKey: decisionKey(viewingId) }) > 0;
}
