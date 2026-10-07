import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoleOverviewData } from "./overview-data";

interface Item {
  label: string;
  value: number;
}

/** The metrics that are not in the top rows. Hidden while the snapshot is unavailable (the page shows a retry). */
export function MoreNumbers({ data }: { data: RoleOverviewData }) {
  if (!data.stats) return null;
  const stats = data.stats;

  const items: Item[] = [
    { label: "Total rooms", value: stats.totalRooms },
    { label: "Published rooms", value: stats.publishedRooms },
    { label: "Total beds", value: stats.totalBeds },
    { label: "Occupied beds", value: stats.occupiedBeds },
    // Managers already see active leases in the top row.
    ...(data.kind === "owner" ? [{ label: "Active leases", value: data.stats.activeLeases }] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">More numbers</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="text-base font-semibold text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
