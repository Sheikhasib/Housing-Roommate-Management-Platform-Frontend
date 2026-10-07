"use client";

import { useRouter } from "next/navigation";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { TenantAnalytics } from "@/types/analytics";

interface LeasesChartProps {
  stats: TenantAnalytics | null;
  errorMessage?: string;
}

export default function LeasesChart({ stats, errorMessage }: LeasesChartProps) {
  const router = useRouter();

  const data = stats
    ? [
        { name: "Active", value: stats.activeLeases, color: "var(--chart-1)" },
        { name: "Completed or ended", value: stats.completedLeases, color: "var(--chart-4)" },
      ]
    : [];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const summary = data.map((item) => `${item.value} ${item.name.toLowerCase()}`).join(", ");

  return (
    <ChartCard
      title="Leases"
      summary={`Leases: ${summary}.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={!errorMessage && total === 0}
      emptyTitle="Nothing to show yet"
      emptyDescription="This chart appears once you have a lease."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="var(--card)"
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ color: "var(--foreground)", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
