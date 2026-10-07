import type { NotificationType } from "@/validation/enums";

/** A row of `GET /notification/my-notifications`. `data` is free-form JSON that may link to the source item. */
export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}
