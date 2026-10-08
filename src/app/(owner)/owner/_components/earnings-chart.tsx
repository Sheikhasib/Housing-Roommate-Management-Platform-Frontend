"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { formatMoney, formatMoneyWhole } from "@/lib/format";
import { AXIS_TICK, TOOLTIP_STYLE } from "./chart-style";

interface EarningsChartProps {
  totalEarnings: number | string;
  outstandingRent: number | string;
  hasData: boolean;
  errorMessage?: string;
}

export default function EarningsChart({ totalEarnings, outstandingRent, hasData, errorMessage }: EarningsChartProps) {
  const router = useRouter();

  // Money arrives as a Decimal string; it becomes a number only here, for the chart.
  const data = [
    { label: "Earnings", amount: Number(totalEarnings) || 0, color: "var(--chart-1)" },
    { label: "Outstanding rent", amount: Number(outstandingRent) || 0, color: "var(--chart-3)" },
  ];
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const summary = data.map((item) => `${formatMoney(item.amount)} ${item.label.toLowerCase()}`).join(", ");

  return (
    <ChartCard
      title="Earnings and outstanding rent"
      summary={`Money: ${summary}.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={hasData && total === 0}
      emptyTitle="Nothing to show yet"
      emptyDescription="This chart appears after your first payment or rent invoice."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={76}
            tickFormatter={(value) => formatMoneyWhole(Number(value))}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(value) => formatMoney(Number(value))}
            {...TOOLTIP_STYLE}
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
