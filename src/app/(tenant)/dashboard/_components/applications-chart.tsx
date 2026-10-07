"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import type { TenantAnalytics } from "@/types/analytics";

interface ApplicationsChartProps {
  stats: TenantAnalytics | null;
  errorMessage?: string;
}

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

export default function ApplicationsChart({ stats, errorMessage }: ApplicationsChartProps) {
  const router = useRouter();

  const data = stats
    ? [
        { status: "Approved", count: stats.approvedApplications },
        { status: "Rejected", count: stats.rejectedApplications },
        {
          status: "Pending or cancelled",
          count: Math.max(0, stats.totalApplications - stats.approvedApplications - stats.rejectedApplications),
        },
      ]
    : [];
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const summary = data.map((item) => `${item.count} ${item.status.toLowerCase()}`).join(", ");

  return (
    <ChartCard
      title="Applications"
      summary={`Applications by result: ${summary}.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={!errorMessage && total === 0}
      emptyTitle="Nothing to show yet"
      emptyDescription="This chart appears after you apply for a room."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="status" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
            {data.map((item, index) => (
              <Cell key={item.status} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
