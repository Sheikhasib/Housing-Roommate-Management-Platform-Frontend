"use client";

import dynamic from "next/dynamic";
import { ChartCardSkeleton } from "@/components/shared/chart-card";
import type { RoleOverviewData } from "./overview-data";

// Recharts is client-only and heavy: load it after the page shell has rendered.
const OccupancyChart = dynamic(() => import("./occupancy-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});
const WorkloadChart = dynamic(() => import("./workload-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});
const RoomsChart = dynamic(() => import("./rooms-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});
const EarningsChart = dynamic(() => import("./earnings-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});

export function OwnerCharts({ data }: { data: RoleOverviewData }) {
  const { errorMessage, stats } = data;
  const hasData = stats !== null;

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <OccupancyChart
        errorMessage={errorMessage}
        hasData={hasData}
        occupiedBeds={stats?.occupiedBeds ?? 0}
        totalBeds={stats?.totalBeds ?? 0}
        occupancyRate={stats?.occupancyRate ?? 0}
      />
      <WorkloadChart
        errorMessage={errorMessage}
        hasData={hasData}
        pendingApplications={stats?.pendingApplications ?? 0}
        pendingViewings={stats?.pendingViewings ?? 0}
        openMaintenance={stats?.openMaintenance ?? 0}
        pendingUtilityInvoices={data.kind === "manager" ? (data.stats?.pendingUtilityInvoices ?? 0) : undefined}
      />
      <RoomsChart
        errorMessage={errorMessage}
        hasData={hasData}
        publishedRooms={stats?.publishedRooms ?? 0}
        totalRooms={stats?.totalRooms ?? 0}
      />
      {data.kind === "owner" ? (
        <EarningsChart
          errorMessage={errorMessage}
          hasData={hasData}
          totalEarnings={data.stats?.totalEarnings ?? 0}
          outstandingRent={data.stats?.outstandingRent ?? 0}
        />
      ) : null}
    </div>
  );
}
