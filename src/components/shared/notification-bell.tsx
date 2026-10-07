"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { NotificationItem } from "@/components/shared/notification-item";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkAllNotificationsRead, useNotificationList, useUnreadCount } from "@/hooks/useNotifications";
import { useSession } from "@/hooks/useSession";

const LATEST_PARAMS = { page: 1, limit: 5 } as const;

function formatBadge(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/** Bell with an unread badge and a dropdown of the latest five notifications, for any logged-in user. */
export function NotificationBell() {
  const { isAuthenticated, isLoading } = useSession();
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount(isAuthenticated);
  const latest = useNotificationList(LATEST_PARAMS, isAuthenticated && open);
  const markAll = useMarkAllNotificationsRead();

  if (!isAuthenticated && !isLoading) return null;

  const count = unread.data ?? 0;
  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={label}>
          <Bell className="size-5" aria-hidden />
          {count > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-none text-primary-foreground"
            >
              {formatBadge(count)}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-10"
            disabled={count === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck aria-hidden />
            Mark all as read
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {latest.isPending ? (
            <div className="space-y-3 p-4" aria-busy="true">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : latest.isError && !latest.data ? (
            <div className="space-y-2 px-4 py-6 text-center" role="alert">
              <p className="text-sm text-muted-foreground">We could not load your notifications.</p>
              <Button variant="outline" size="sm" className="min-h-10" onClick={() => void latest.refetch()}>
                Try again
              </Button>
            </div>
          ) : latest.data && latest.data.rows.length > 0 ? (
            <ul className="divide-y divide-border">
              {latest.data.rows.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem notification={notification} onSelect={() => setOpen(false)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up</p>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" className="min-h-10 w-full">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              View all
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
