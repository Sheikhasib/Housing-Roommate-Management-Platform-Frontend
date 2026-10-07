"use client";

import type { ReactNode } from "react";
import { BellRing, CheckCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { NotificationItem } from "@/components/shared/notification-item";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkAllNotificationsRead, useNotificationList, useUnreadCount } from "@/hooks/useNotifications";
import { useUrlState } from "@/hooks/useUrlState";
import type { NotificationsQuery } from "@/lib/api/notification";

const TABS = ["all", "unread", "read"] as const;
type NotificationsTab = (typeof TABS)[number];

const IS_READ_BY_TAB: Record<NotificationsTab, NotificationsQuery["isRead"]> = {
  all: undefined,
  unread: "false",
  read: "true",
};

const EMPTY_TEXT: Record<NotificationsTab, string> = {
  all: "New updates will show up here.",
  unread: "You have no unread notifications.",
  read: "Notifications you have read will show up here.",
};

function isTab(value: string): value is NotificationsTab {
  return (TABS as readonly string[]).includes(value);
}

export function NotificationsView({ header }: { header: ReactNode }) {
  const { page, limit, getParam, setParams } = useUrlState();
  const raw = getParam("tab");
  const tab: NotificationsTab = isTab(raw) ? raw : "all";

  const query = useNotificationList({ page, limit, isRead: IS_READ_BY_TAB[tab] });
  const unread = useUnreadCount(true);
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">{header}</div>
        <Button
          variant="outline"
          className="min-h-10 shrink-0 self-start"
          disabled={(unread.data ?? 0) === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          <CheckCheck aria-hidden />
          Mark all as read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(next) => setParams({ tab: next === "all" ? null : next, limit })} className="gap-4">
        <TabsList className="h-10 w-full sm:w-fit">
          <TabsTrigger value="all" className="min-h-9 flex-1 px-4 sm:flex-none">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="min-h-9 flex-1 px-4 sm:flex-none">
            Unread
          </TabsTrigger>
          <TabsTrigger value="read" className="min-h-9 flex-1 px-4 sm:flex-none">
            Read
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          {query.isPending ? (
            <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm" aria-busy="true">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : query.isError && !query.data ? (
            <div className="rounded-xl border bg-card shadow-sm">
              <ErrorState
                error={query.error}
                message="We could not load your notifications. Check your connection and try again."
                onRetry={() => void query.refetch()}
              />
            </div>
          ) : query.data && query.data.rows.length > 0 ? (
            <>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border bg-card shadow-sm">
                {query.data.rows.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} />
                  </li>
                ))}
              </ul>
              <Pagination meta={query.data.meta} />
            </>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm">
              <EmptyState icon={BellRing} title="You're all caught up" description={EMPTY_TEXT[tab]} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
