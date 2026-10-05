"use client";

import dynamic from "next/dynamic";
import { ChartCardSkeleton } from "@/components/shared/chart-card";
import type { AdminDashboardStats } from "@/types/admin";

// Recharts is client-only and heavy: load it after the page shell has rendered.
const UsersByRoleChart = dynamic(() => import("./users-by-role-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});
const OccupancyChart = dynamic(() => import("./occupancy-chart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});

interface AdminChartsProps {
  stats: AdminDashboardStats | null;
  errorMessage?: string;
}

export function AdminCharts({ stats, errorMessage }: AdminChartsProps) {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <UsersByRoleChart stats={stats} errorMessage={errorMessage} />
      <OccupancyChart stats={stats} errorMessage={errorMessage} />
    </div>
  );
}
