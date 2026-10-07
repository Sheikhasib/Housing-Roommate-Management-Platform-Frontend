import type { ReactNode } from "react";
import Link from "next/link";
import { CreditCard, FileText, ScrollText, Wrench } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { formatMoney } from "@/lib/format";
import type { TenantAnalytics } from "@/types/analytics";
import { RetryNotice } from "./retry-notice";

interface OverviewStatsProps {
  stats: TenantAnalytics | null;
  errorMessage?: string;
}

const UNAVAILABLE = "Could not load this number";

/** Wraps a card in a link only when the target page exists. */
export function LinkedCard({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link
      href={href}
      className="block h-full rounded-xl transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

export function OverviewStats({ stats, errorMessage }: OverviewStatsProps) {
  return (
    <section aria-label="Key numbers" className="space-y-4">
      {errorMessage ? (
        <RetryNotice title="Could not load your numbers" message={errorMessage} />
      ) : null}
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LinkedCard href="/dashboard/applications">
          <StatCard
            label="Applications"
            value={stats ? stats.totalApplications : "—"}
            icon={FileText}
            hint={
              stats
                ? `${stats.approvedApplications} approved, ${stats.rejectedApplications} rejected`
                : UNAVAILABLE
            }
          />
        </LinkedCard>
        <LinkedCard href="/dashboard/leases">
          <StatCard
            label="Active leases"
            value={stats ? stats.activeLeases : "—"}
            icon={ScrollText}
            hint={stats ? `${stats.completedLeases} completed or ended` : UNAVAILABLE}
          />
        </LinkedCard>
        <LinkedCard href="/dashboard/invoices">
          <StatCard
            label="Total due"
            value={stats ? formatMoney(stats.totalDue) : "—"}
            icon={CreditCard}
            hint={stats ? `${stats.outstandingInvoices} unpaid invoices` : UNAVAILABLE}
          />
        </LinkedCard>
        <LinkedCard href="/dashboard/maintenance">
          <StatCard
            label="Open maintenance"
            value={stats ? stats.openMaintenance : "—"}
            icon={Wrench}
            hint={stats ? "Requests not resolved or closed yet" : UNAVAILABLE}
          />
        </LinkedCard>
      </div>
    </section>
  );
}
