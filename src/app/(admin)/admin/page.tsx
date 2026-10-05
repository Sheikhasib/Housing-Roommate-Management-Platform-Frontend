import type { Metadata } from "next";
import { Building2, CreditCard, ShieldCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { getAdminDashboardStats, getPendingRefundCount } from "@/lib/api/admin";
import { formatMoney } from "@/lib/format";
import { AdminCharts } from "./_components/admin-charts";
import { OverviewErrorToast } from "./_components/overview-error-toast";
import { PendingQueues } from "./_components/pending-queues";

export const metadata: Metadata = {
  title: "Admin overview",
  robots: { index: false },
};

const UNAVAILABLE = "Could not load this number";

export default async function AdminOverviewPage() {
  const [statsResult, refundsResult] = await Promise.all([
    getAdminDashboardStats(),
    getPendingRefundCount(),
  ]);

  const stats = statsResult.ok ? statsResult.data : null;
  const refunds = refundsResult.ok ? refundsResult.data : null;
  const errors = [
    ...(statsResult.ok ? [] : [statsResult.message]),
    ...(refundsResult.ok ? [] : [refundsResult.message]),
  ];

  return (
    <div className="space-y-6">
      <OverviewErrorToast messages={errors} />
      <PageHeader
        title="Overview"
        description="Live platform numbers and the queues that need an admin."
      />

      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats ? stats.totalUsers : "—"}
          icon={Users}
          hint={stats ? `${stats.blockedUsers} blocked` : UNAVAILABLE}
        />
        <StatCard
          label="Pending verifications"
          value={stats ? stats.pendingOwnerVerifications + stats.pendingTenantVerifications : "—"}
          icon={ShieldCheck}
          hint={
            stats
              ? `${stats.pendingOwnerVerifications} owners, ${stats.pendingTenantVerifications} tenants`
              : UNAVAILABLE
          }
        />
        <StatCard
          label="Properties"
          value={stats ? stats.totalProperties : "—"}
          icon={Building2}
          hint={stats ? `${stats.totalRooms} rooms` : UNAVAILABLE}
        />
        <StatCard
          label="Total revenue"
          value={stats ? formatMoney(stats.totalRevenue) : "—"}
          icon={CreditCard}
          hint={stats ? "Paid payments only. Refunds are already left out." : UNAVAILABLE}
        />
      </div>

      <AdminCharts stats={stats} errorMessage={statsResult.ok ? undefined : statsResult.message} />

      <PendingQueues
        ownerVerifications={stats ? stats.pendingOwnerVerifications : null}
        tenantVerifications={stats ? stats.pendingTenantVerifications : null}
        refunds={refunds}
      />
    </div>
  );
}
