"use client";

import dynamic from "next/dynamic";
import { ChartCardSkeleton } from "@/components/shared/chart-card";
import type { TenantAnalytics } from "@/types/analytics";

// Recharts is client-only and heavy: load it after the page shell has rendered.
const ApplicationsChart = dynamic(() => import("./applications-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});
const LeasesChart = dynamic(() => import("./leases-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});
const MoneyChart = dynamic(() => import("./money-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});

interface TenantChartsProps {
  stats: TenantAnalytics | null;
  errorMessage?: string;
}

export function TenantCharts({ stats, errorMessage }: TenantChartsProps) {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <ApplicationsChart stats={stats} errorMessage={errorMessage} />
      <LeasesChart stats={stats} errorMessage={errorMessage} />
      <MoneyChart stats={stats} errorMessage={errorMessage} />
    </div>
  );
}
