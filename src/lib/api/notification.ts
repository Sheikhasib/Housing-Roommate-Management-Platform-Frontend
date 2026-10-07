import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { NotificationRow } from "@/types/notification";

export interface NotificationListResult {
  rows: NotificationRow[];
  meta: ApiMeta;
}

export interface NotificationsQuery {
  page: number;
  limit: number;
  /** Left out for All. The backend treats any value other than "true" as unread. */
  isRead?: "true" | "false";
}

export async function getNotifications(query: NotificationsQuery): Promise<NotificationListResult> {
  const response = await apiClient<ApiSuccess<NotificationRow[]>>("/notification/my-notifications", {
    query: { page: query.page, limit: query.limit, ...(query.isRead ? { isRead: query.isRead } : {}) },
  });
  const rows = response.data;
  return {
    rows,
    meta: response.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient<ApiSuccess<{ unreadCount: number }>>("/notification/unread-count");
  return response.data.unreadCount;
}

export function markNotificationRead(notificationId: string) {
  return apiClient<ApiSuccess<NotificationRow>>(`/notification/${encodeURIComponent(notificationId)}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiClient<ApiSuccess<{ updatedCount: number }>>("/notification/read-all", { method: "PATCH" });
}
