"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/apiError";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListResult,
  type NotificationsQuery,
} from "@/lib/api/notification";

export const NOTIFICATIONS_KEY = ["notifications"] as const;
export const UNREAD_COUNT_KEY = ["notifications", "unread"] as const;
export const notificationsListKey = (params: NotificationsQuery) => ["notifications", "list", params] as const;

const POLL_INTERVAL_MS = 60_000;
const GENERIC_ERROR = "Something went wrong. Please try again.";

function failureMessage(error: unknown): string {
  if (!(error instanceof ApiError) || error.status >= 500) return GENERIC_ERROR;
  return error.errors[0]?.message || error.message || GENERIC_ERROR;
}

/** The unread badge number. Refetched every minute and when the window regains focus. */
export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: getUnreadCount,
    enabled,
    retry: false,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationList(params: NotificationsQuery, enabled = true) {
  const result = useQuery({
    queryKey: notificationsListKey(params),
    queryFn: () => getNotifications(params),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
  useEffect(() => {
    if (result.error) toast.error(failureMessage(result.error));
  }, [result.error]);
  return result;
}

interface OptimisticContext {
  lists: [readonly unknown[], NotificationListResult | undefined][];
  count: number | undefined;
}

function useOptimisticMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  apply: (variables: TVariables, now: string) => { unreadDelta: "all" | number; markRow: (id: string) => boolean },
) {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, TVariables, OptimisticContext>({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const lists = queryClient.getQueriesData<NotificationListResult>({ queryKey: ["notifications", "list"] });
      const count = queryClient.getQueryData<number>(UNREAD_COUNT_KEY);

      const now = new Date().toISOString();
      const { unreadDelta, markRow } = apply(variables, now);

      queryClient.setQueriesData<NotificationListResult>({ queryKey: ["notifications", "list"] }, (current) =>
        current
          ? {
              ...current,
              rows: current.rows.map((row) =>
                markRow(row.id) && !row.isRead ? { ...row, isRead: true, readAt: now } : row,
              ),
            }
          : current,
      );
      queryClient.setQueryData<number>(UNREAD_COUNT_KEY, (current) =>
        current === undefined ? current : unreadDelta === "all" ? 0 : Math.max(0, current + unreadDelta),
      );
      return { lists, count };
    },
    onError: (error, _variables, context) => {
      context?.lists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      queryClient.setQueryData(UNREAD_COUNT_KEY, context?.count);
      toast.error(failureMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

/** Marks one notification read straight away. `wasUnread` keeps the badge number right when the row is already read. */
export function useMarkNotificationRead() {
  return useOptimisticMutation<{ id: string; wasUnread: boolean }>(
    ({ id }) => markNotificationRead(id),
    ({ id, wasUnread }) => ({ unreadDelta: wasUnread ? -1 : 0, markRow: (rowId) => rowId === id }),
  );
}

export function useMarkAllNotificationsRead() {
  return useOptimisticMutation<void>(
    () => markAllNotificationsRead(),
    () => ({ unreadDelta: "all", markRow: () => true }),
  );
}
