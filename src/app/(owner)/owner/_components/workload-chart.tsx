"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { AXIS_TICK, TOOLTIP_STYLE } from "./chart-style";

interface WorkloadChartProps {
  pendingApplications: number;
  pendingViewings: number;
  openMaintenance: number;
  /** Managers only. */
  pendingUtilityInvoices?: number;
  hasData: boolean;
  errorMessage?: string;
}

const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export default function WorkloadChart({
  pendingApplications,
  pendingViewings,
  openMaintenance,
  pendingUtilityInvoices,
  hasData,
  errorMessage,
}: WorkloadChartProps) {
  const router = useRouter();
  const data = [
    { label: "Applications", count: pendingApplications },
    { label: "Viewings", count: pendingViewings },
    { label: "Maintenance", count: openMaintenance },
    ...(pendingUtilityInvoices === undefined ? [] : [{ label: "Utility invoices", count: pendingUtilityInvoices }]),
  ];
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const summary = data.map((item) => `${item.count} ${item.label.toLowerCase()}`).join(", ");

  return (
    <ChartCard
      title="Workload"
      summary={`Pending work: ${summary}.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={hasData && total === 0}
      emptyTitle="Nothing to show yet"
      emptyDescription="This chart appears when something is waiting for you."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "var(--muted)" }} {...TOOLTIP_STYLE} />
          <Bar dataKey="count" name="Waiting" radius={[6, 6, 0, 0]}>
            {data.map((item, index) => (
              <Cell key={item.label} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
