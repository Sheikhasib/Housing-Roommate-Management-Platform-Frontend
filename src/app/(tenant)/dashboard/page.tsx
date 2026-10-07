import type { Metadata } from "next";

import { OverviewErrorToast } from "@/app/(admin)/admin/_components/overview-error-toast";
import { PageHeader } from "@/components/shared/page-header";
import { getDepositActions, getTenantAnalytics, getUnpaidInvoices } from "@/lib/api/tenantOverview";
import { MoreNumbers } from "./_components/more-numbers";
import { NextActions } from "./_components/next-actions";
import { OverviewStats } from "./_components/overview-stats";
import { TenantCharts } from "./_components/tenant-charts";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false },
};

export default async function TenantOverviewPage() {
  const [analyticsResult, depositsResult, invoicesResult] = await Promise.all([
    getTenantAnalytics(),
    getDepositActions(),
    getUnpaidInvoices(),
  ]);

  const stats = analyticsResult.ok ? analyticsResult.data : null;
  const analyticsError = analyticsResult.ok ? undefined : analyticsResult.message;
  const errors = [analyticsResult, depositsResult, invoicesResult].flatMap((result) =>
    result.ok ? [] : [result.message],
  );

  return (
    <div className="space-y-6">
      <OverviewErrorToast messages={Array.from(new Set(errors))} />
      <PageHeader
        title="Overview"
        description="Where you stand with applications, leases, money and requests."
      />

      <OverviewStats stats={stats} errorMessage={analyticsError} />
      <MoreNumbers stats={stats} />
      <TenantCharts stats={stats} errorMessage={analyticsError} />
      <NextActions
        applications={depositsResult.ok ? depositsResult.data : null}
        invoices={invoicesResult.ok ? invoicesResult.data : null}
        applicationsError={depositsResult.ok ? undefined : depositsResult.message}
        invoicesError={invoicesResult.ok ? undefined : invoicesResult.message}
      />
    </div>
  );
}
