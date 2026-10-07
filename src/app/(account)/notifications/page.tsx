import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { NotificationsSkeleton } from "./_components/notifications-skeleton";
import { NotificationsView } from "./_components/notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false },
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsView
          header={
            <PageHeader title="Notifications" description="Updates about your applications, leases, payments and more." />
          }
        />
      </Suspense>
    </div>
  );
}
