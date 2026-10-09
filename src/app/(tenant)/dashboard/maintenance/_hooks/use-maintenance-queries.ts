"use client";

import { useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getMyLeases } from "@/lib/api/lease";
import { getMyRequests, type MyRequestsQuery } from "@/lib/api/maintenance";
import { getMyMemberships } from "@/lib/api/roommate";
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

/**
 * The rooms a tenant can report on: one option per room of an ACTIVE lease, plus the rooms where
 * they are an ACTIVE roommate member (specs 11 and 13). The backend attaches a member's request to the holder's lease.
 */
export function useActiveLeaseRooms() {
  return useQuery({
    queryKey: ["leases", "mine", "active-rooms"],
    queryFn: async (): Promise<RoomOption[]> => {
      const [{ rows }, memberships] = await Promise.all([
        getMyLeases({ page: 1, limit: 50, status: "ACTIVE" }),
        // Lease rooms still load when the memberships read fails.
        getMyMemberships({ page: 1, limit: 100, status: "ACTIVE" }).catch(() => ({ rows: [] })),
      ]);
      const seen = new Set<string>();
      const options: RoomOption[] = [];
      const add = (room: { id: string; name: string; property: { title: string; city: string } }) => {
        if (seen.has(room.id)) return;
        seen.add(room.id);
        options.push({ id: room.id, label: `${room.name}, ${room.property.title} (${room.property.city})` });
      };
      for (const lease of rows) {
        if (lease.status === "ACTIVE") add(lease.room);
      }
      for (const membership of memberships.rows) {
        if (membership.role === "MEMBER" && membership.status === "ACTIVE") add(membership.room);
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
