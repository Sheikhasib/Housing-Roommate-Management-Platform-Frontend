"use client";

import Link from "next/link";
import {
  CalendarClock,
  CreditCard,
  FileSignature,
  FileText,
  Info,
  Receipt,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { useMarkNotificationRead } from "@/hooks/useNotifications";
import { useSession } from "@/hooks/useSession";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { resolveNotificationHref } from "@/lib/notification-links";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/types/notification";
import type { NotificationType } from "@/validation/enums";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  APPLICATION: FileText,
  VIEWING: CalendarClock,
  PAYMENT: CreditCard,
  LEASE: FileSignature,
  MAINTENANCE: Wrench,
  INVOICE: Receipt,
  ROOMMATE: Users,
  SYSTEM: Info,
};

interface NotificationItemProps {
  notification: NotificationRow;
  /** Called after a click, for example to close the dropdown. */
  onSelect?: () => void;
  className?: string;
}

/**
 * One notification. A click marks it read, then opens the item it describes when there is a
 * reliable target for the user's role; otherwise it only marks it read and stays on the page.
 */
export function NotificationItem({ notification, onSelect, className }: NotificationItemProps) {
  const { role } = useSession();
  const markRead = useMarkNotificationRead();
  const Icon = TYPE_ICONS[notification.type] ?? Info;
  const href = resolveNotificationHref(notification, role);

  const handleClick = () => {
    if (!notification.isRead) markRead.mutate({ id: notification.id, wasUnread: true });
    onSelect?.();
  };

  const classes = cn(
    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
    !notification.isRead && "bg-accent/40",
    className,
  );

  const content = (
    <>
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span
          className={cn(
            "block truncate text-sm text-foreground",
            notification.isRead ? "font-normal" : "font-semibold",
          )}
        >
          {notification.title}
        </span>
        <span className="line-clamp-2 block text-sm text-muted-foreground">{notification.message}</span>
        <time
          dateTime={notification.createdAt}
          title={formatDateTime(notification.createdAt)}
          className="block text-xs text-muted-foreground"
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </span>
      {notification.isRead ? null : (
        <>
          <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span className="sr-only">Unread</span>
        </>
      )}
    </>
  );

  return href ? (
    <Link href={href} onClick={handleClick} className={classes}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={handleClick} className={classes}>
      {content}
    </button>
  );
}
