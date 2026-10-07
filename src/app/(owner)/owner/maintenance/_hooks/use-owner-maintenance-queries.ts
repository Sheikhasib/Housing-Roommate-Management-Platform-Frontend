"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  getOwnerRequests,
  updateMaintenanceStatus,
  type OwnerRequestsQuery,
} from "@/lib/api/maintenance";
import { plainMaintenanceError } from "@/lib/maintenance-labels";
import type { UpdateMaintenanceStatusPayload } from "@/validation/maintenance";

export const ownerMaintenanceKey = (params?: unknown) =>
  params === undefined
    ? (["maintenance", "owner"] as const)
    : (["maintenance", "owner", params] as const);

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useOwnerRequests(query: OwnerRequestsQuery, enabled: boolean) {
  const result = useQuery({
    queryKey: ownerMaintenanceKey(query),
    queryFn: () => getOwnerRequests(query),
    enabled,
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(plainMaintenanceError(result.error));
  }, [result.error]);
  return result;
}

/** After a status change or a photo: refetch the list and the server-rendered overview counts. */
export function useRefreshOwnerMaintenance() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ownerMaintenanceKey() });
    router.refresh();
  };
}

/** Not optimistic: the server decides whether the move is allowed. */
export function useUpdateMaintenanceStatus(requestId: string) {
  const refresh = useRefreshOwnerMaintenance();
  return useMutation({
    mutationFn: (body: UpdateMaintenanceStatusPayload) => updateMaintenanceStatus(requestId, body),
    onSuccess: refresh,
  });
}
