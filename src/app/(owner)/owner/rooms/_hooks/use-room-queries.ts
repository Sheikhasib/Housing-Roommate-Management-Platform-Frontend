"use client";

import { useEffect } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { getOwnedProperties } from "@/lib/api/ownerProperty";
import {
  getOwnerRoom,
  getRooms,
  MANAGER_PROPERTIES_LIMIT,
  setRoomAvailability,
  type OwnerRoomsQuery,
  type OwnerRoomsResult,
} from "@/lib/api/ownerRoom";
import type { OwnerRoomDetail } from "@/types/owner-room";

export const roomsKey = (params?: unknown) =>
  params === undefined ? (["rooms", "mine"] as const) : (["rooms", "mine", params] as const);
export const roomKey = (id: string) => ["room", id] as const;

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

/** One toast per failed load. */
function useErrorToast(error: unknown) {
  useEffect(() => {
    if (error) toast.error(errorMessage(error));
  }, [error]);
}

export function useRooms(isManager: boolean, enabled: boolean, query: OwnerRoomsQuery) {
  const result = useQuery({
    queryKey: [...roomsKey(query), isManager],
    queryFn: () => getRooms(isManager, query),
    enabled,
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

/**
 * Properties for the property pickers. Spec 05 documents no maximum `limit` for
 * `my-properties`, so this asks for 100: an account with more properties sees a partial picker.
 */
export function usePropertyPicker(isManager: boolean, enabled: boolean) {
  const result = useQuery({
    queryKey: ["properties", "mine", "picker", isManager],
    queryFn: () => getOwnedProperties(isManager, { page: 1, limit: MANAGER_PROPERTIES_LIMIT }),
    enabled,
    staleTime: 60 * 1000,
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

/** The server page already loaded the room; the query keeps it fresh after edits. */
export function useOwnerRoom(roomId: string, initialData: OwnerRoomDetail) {
  return useQuery({
    queryKey: roomKey(roomId),
    queryFn: () => getOwnerRoom(roomId),
    initialData,
    staleTime: 30 * 1000,
    ...OPTIONS,
  });
}

/** After a change: refetch this room and every list that shows it. */
export function useRefreshRoom(roomId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: roomKey(roomId) });
    void queryClient.invalidateQueries({ queryKey: roomsKey() });
  };
}

/** Status or available-from changes. Not optimistic: the backend may refuse them (409). */
export function useSetAvailability(roomId: string) {
  const refresh = useRefreshRoom(roomId);
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => setRoomAvailability(roomId, body),
    onSuccess: refresh,
  });
}

interface PublishContext {
  lists: [QueryKey, OwnerRoomsResult | undefined][];
  detail: OwnerRoomDetail | undefined;
}

/**
 * Optimistic publish switch (`PATCH /room/:id/availability { isPublished }`): the cached list rows
 * and the room detail change at once, an error restores them and toasts the backend message, and
 * the end of the call refetches.
 */
export function usePublishRoom(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, boolean, PublishContext>({
    mutationFn: (isPublished) => setRoomAvailability(roomId, { isPublished }),
    onMutate: async (isPublished) => {
      await queryClient.cancelQueries({ queryKey: roomsKey() });
      await queryClient.cancelQueries({ queryKey: roomKey(roomId) });

      const lists = queryClient.getQueriesData<OwnerRoomsResult>({ queryKey: roomsKey() });
      const detail = queryClient.getQueryData<OwnerRoomDetail>(roomKey(roomId));

      for (const [key, data] of lists) {
        if (!data) continue;
        queryClient.setQueryData<OwnerRoomsResult>(key, {
          ...data,
          rows: data.rows.map((row) => (row.id === roomId ? { ...row, isPublished } : row)),
        });
      }
      if (detail) queryClient.setQueryData<OwnerRoomDetail>(roomKey(roomId), { ...detail, isPublished });

      return { lists, detail };
    },
    onError: (error, _isPublished, context) => {
      for (const [key, data] of context?.lists ?? []) queryClient.setQueryData(key, data);
      if (context?.detail) queryClient.setQueryData(roomKey(roomId), context.detail);
      toast.error(errorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomsKey() });
      void queryClient.invalidateQueries({ queryKey: roomKey(roomId) });
    },
  });
}
