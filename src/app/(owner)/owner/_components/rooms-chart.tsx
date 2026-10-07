"use client";

import { useRouter } from "next/navigation";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { TOOLTIP_STYLE } from "./chart-style";

interface RoomsChartProps {
  publishedRooms: number;
  totalRooms: number;
  hasData: boolean;
  errorMessage?: string;
}

export default function RoomsChart({ publishedRooms, totalRooms, hasData, errorMessage }: RoomsChartProps) {
  const router = useRouter();
  const unpublishedRooms = Math.max(0, totalRooms - publishedRooms);
  const data = [
    { name: "Published", value: publishedRooms, color: "var(--chart-2)" },
    { name: "Unpublished", value: unpublishedRooms, color: "var(--chart-3)" },
  ];

  return (
    <ChartCard
      title="Rooms"
      summary={`Rooms: ${publishedRooms} published and ${unpublishedRooms} unpublished, out of ${totalRooms}.`}
      errorMessage={errorMessage}
      onRetry={() => router.refresh()}
      isEmpty={hasData && totalRooms === 0}
      emptyTitle="Nothing to show yet"
      emptyDescription="This chart appears once a room has been added."
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
