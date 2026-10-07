import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { TenantAnalytics } from "@/types/analytics";

interface MoreNumbersProps {
  stats: TenantAnalytics | null;
}

interface Item {
  label: string;
  value: string | number;
  /** Only set when the page exists. */
  href?: string;
}

/** The metrics that are not in the top row. Hidden while the snapshot is unavailable (the page shows a retry). */
export function MoreNumbers({ stats }: MoreNumbersProps) {
  if (!stats) return null;

  const items: Item[] = [
    { label: "Approved applications", value: stats.approvedApplications, href: "/dashboard/applications" },
    { label: "Rejected applications", value: stats.rejectedApplications, href: "/dashboard/applications" },
    { label: "Completed or ended leases", value: stats.completedLeases, href: "/dashboard/leases" },
    { label: "Total spent", value: formatMoney(stats.totalSpent), href: "/dashboard/payments" },
    { label: "Unpaid invoices", value: stats.outstandingInvoices, href: "/dashboard/invoices" },
    { label: "Roommates", value: stats.roommateCount },
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
              <dt className="text-sm text-muted-foreground">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="rounded-sm transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </dt>
              <dd className="text-base font-semibold text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
