import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { AuditLogsList } from "./_components/audit-logs-list";
import { AuditLogsSkeleton } from "./_components/audit-logs-skeleton";

export const metadata: Metadata = {
  title: "Audit logs",
  robots: { index: false },
};

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit logs" description="A read-only record of who changed what, newest first." />
      <Suspense fallback={<AuditLogsSkeleton />}>
        <AuditLogsList />
      </Suspense>
    </div>
  );
}
