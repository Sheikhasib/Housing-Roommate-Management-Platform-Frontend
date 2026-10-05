"use client";

import { useRouter } from "next/navigation";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { AdminDashboardStats } from "@/types/admin";

interface OccupancyChartProps {
  stats: AdminDashboardStats | null;
  errorMessage?: string;
}

export default function OccupancyChart({ stats, errorMessage }: OccupancyChartProps) {
  const router = useRouter();

  const rate = stats ? Math.min(100, Math.max(0, stats.occupancyRate)) : 0;
  const data = [{ name: "Occupancy", value: rate }];
  const detail = stats ? `${stats.occupiedBeds} of ${stats.totalBeds} beds occupied` : "";

  return (
    <ChartCard
      title="Bed occupancy"
      summary={`Bed occupancy is ${rate} percent: ${detail}.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={!errorMessage && (stats?.totalBeds ?? 0) === 0}
      emptyTitle="No beds listed yet"
      emptyDescription="Occupancy appears once rooms with beds are added."
    >
      <div className="relative h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill="var(--chart-1)"
              background={{ fill: "var(--muted)" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-semibold text-foreground">{rate}%</span>
          <span className="text-xs text-muted-foreground">{detail}</span>
        </div>
      </div>
    </ChartCard>
  );
}
