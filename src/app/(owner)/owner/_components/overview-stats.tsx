import { Banknote, Building2, Gauge, ReceiptText, ScrollText } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { formatMoney } from "@/lib/format";
import type { RoleOverviewData } from "./overview-data";

const UNAVAILABLE = "Could not load this number";

function bedsHint(occupied: number, total: number): string {
  return `${occupied} of ${total} beds occupied`;
}

export function OverviewStats({ data }: { data: RoleOverviewData }) {
  if (data.kind === "owner") {
    const stats = data.stats;
    return (
      <section aria-label="Key numbers" className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Properties"
          value={stats ? stats.totalProperties : "—"}
          icon={Building2}
          hint={stats ? `${stats.totalRooms} rooms in total` : UNAVAILABLE}
        />
        <StatCard
          label="Occupancy rate"
          value={stats ? `${stats.occupancyRate}%` : "—"}
          icon={Gauge}
          hint={stats ? bedsHint(stats.occupiedBeds, stats.totalBeds) : UNAVAILABLE}
        />
        <StatCard
          label="Total earnings"
          value={stats ? formatMoney(stats.totalEarnings) : "—"}
          icon={Banknote}
          hint={stats ? "Sum of paid payments" : UNAVAILABLE}
        />
        <StatCard
          label="Outstanding rent"
          value={stats ? formatMoney(stats.outstandingRent) : "—"}
          icon={ReceiptText}
          hint={stats ? "Unpaid rent invoices" : UNAVAILABLE}
        />
      </section>
    );
  }

  const stats = data.stats;
  return (
    <section aria-label="Key numbers" className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Managed properties"
        value={stats ? stats.managedProperties : "—"}
        icon={Building2}
        hint={stats ? `${stats.totalRooms} rooms in total` : UNAVAILABLE}
      />
      <StatCard
        label="Occupancy rate"
        value={stats ? `${stats.occupancyRate}%` : "—"}
        icon={Gauge}
        hint={stats ? bedsHint(stats.occupiedBeds, stats.totalBeds) : UNAVAILABLE}
      />
      <StatCard
        label="Active leases"
        value={stats ? stats.activeLeases : "—"}
        icon={ScrollText}
        hint={stats ? "Leases currently running" : UNAVAILABLE}
      />
      <StatCard
        label="Pending utility invoices"
        value={stats ? stats.pendingUtilityInvoices : "—"}
        icon={ReceiptText}
        hint={stats ? "Unpaid utility invoices" : UNAVAILABLE}
      />
    </section>
  );
}
