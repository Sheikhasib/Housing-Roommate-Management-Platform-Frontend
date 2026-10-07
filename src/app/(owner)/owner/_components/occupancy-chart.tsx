"use client";

import { useRouter } from "next/navigation";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { TOOLTIP_STYLE } from "./chart-style";

interface OccupancyChartProps {
  occupiedBeds: number;
  totalBeds: number;
  occupancyRate: number;
  hasData: boolean;
  errorMessage?: string;
}

export default function OccupancyChart({
  occupiedBeds,
  totalBeds,
  occupancyRate,
  hasData,
  errorMessage,
}: OccupancyChartProps) {
  const router = useRouter();
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
  const data = [
    { name: "Occupied", value: occupiedBeds, color: "var(--chart-1)" },
    { name: "Vacant", value: vacantBeds, color: "var(--chart-4)" },
  ];

  return (
    <ChartCard
      title="Occupancy"
      summary={`Occupancy: ${occupiedBeds} of ${totalBeds} beds occupied, ${vacantBeds} vacant, ${occupancyRate} percent occupied.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={hasData && totalBeds === 0}
      emptyTitle="Nothing to show yet"
      emptyDescription="This chart appears once your rooms have beds."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" stroke="var(--card)">
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
