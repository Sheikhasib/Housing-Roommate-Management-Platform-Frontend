"use client";

import { useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getMyLeases } from "@/lib/api/lease";
import { getMyRequests, type MyRequestsQuery } from "@/lib/api/maintenance";
import { plainMaintenanceError } from "@/lib/maintenance-labels";

export const maintenanceKey = (params?: unknown) =>
  params === undefined ? (["maintenance", "mine"] as const) : (["maintenance", "mine", params] as const);

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

export function useMyRequests(query: MyRequestsQuery) {
  const result = useQuery({
    queryKey: maintenanceKey(query),
    queryFn: () => getMyRequests(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useEffect(() => {
    if (result.error) toast.error(plainMaintenanceError(result.error));
  }, [result.error]);
  return result;
}

export interface RoomOption {
  id: string;
  label: string;
}

/** The rooms a tenant can report on: one option per room of an ACTIVE lease (spec 11). */
export function useActiveLeaseRooms() {
  return useQuery({
    queryKey: ["leases", "mine", "active-rooms"],
    queryFn: async (): Promise<RoomOption[]> => {
      const { rows } = await getMyLeases({ page: 1, limit: 50, status: "ACTIVE" });
      const seen = new Set<string>();
      const options: RoomOption[] = [];
      for (const lease of rows) {
        if (lease.status !== "ACTIVE" || seen.has(lease.room.id)) continue;
        seen.add(lease.room.id);
        options.push({
          id: lease.room.id,
          label: `${lease.room.name}, ${lease.room.property.title} (${lease.room.property.city})`,
        });
      }
      return options;
    },
    ...OPTIONS,
  });
}

/** After a request or a photo changes: refetch the list. */
export function useRefreshMaintenance() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: maintenanceKey() });
  };
}
