"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { formatMoney } from "@/lib/format";
import type { TenantAnalytics } from "@/types/analytics";

interface MoneyChartProps {
  stats: TenantAnalytics | null;
  errorMessage?: string;
}

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

export default function MoneyChart({ stats, errorMessage }: MoneyChartProps) {
  const router = useRouter();

  // Money arrives as a Decimal string; it becomes a number only here, for the chart.
  const data = stats
    ? [
        { label: "Spent", amount: Number(stats.totalSpent) || 0, color: "var(--chart-1)" },
        { label: "Due", amount: Number(stats.totalDue) || 0, color: "var(--chart-3)" },
      ]
    : [];
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const summary = data.map((item) => `${formatMoney(item.amount)} ${item.label.toLowerCase()}`).join(", ");

  return (
    <ChartCard
      title="Money"
      summary={`Money: ${summary}.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={!errorMessage && total === 0}
      emptyTitle="Nothing to show yet"
      emptyDescription="This chart appears after your first payment or invoice."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(value) => formatMoney(Number(value))}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]}>
            {data.map((item) => (
              <Cell key={item.label} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
