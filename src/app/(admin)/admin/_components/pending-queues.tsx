import Link from "next/link";
import { ArrowRight, Building2, CircleDollarSign, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QueueItem {
  label: string;
  /** `null` means the count could not be loaded. */
  count: number | null;
  href: string;
  icon: LucideIcon;
  emptyHint: string;
}

interface PendingQueuesProps {
  ownerVerifications: number | null;
  tenantVerifications: number | null;
  refunds: number | null;
}

function QueueCard({ label, count, href, icon: Icon, emptyHint }: QueueItem) {
  const hint =
    count === null ? "Could not load this count" : count === 0 ? emptyHint : "Waiting for review";
  return (
    <Link
      href={href}
      className="group block h-full rounded-xl transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="aura-glow h-full transition-shadow duration-200 group-hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-foreground">{label}</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-foreground">{count ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-accent-foreground">
            Open queue
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PendingQueues({ ownerVerifications, tenantVerifications, refunds }: PendingQueuesProps) {
  const items: QueueItem[] = [
    {
      label: "Owner verifications",
      count: ownerVerifications,
      href: "/admin/verifications",
      icon: Building2,
      emptyHint: "No pending verifications",
    },
    {
      label: "Tenant verifications",
      count: tenantVerifications,
      href: "/admin/verifications",
      icon: UserCheck,
      emptyHint: "No pending verifications",
    },
    {
      label: "Pending refunds",
      count: refunds,
      href: "/admin/payments",
      icon: CircleDollarSign,
      emptyHint: "No refunds waiting",
    },
  ];

  return (
    <section aria-labelledby="pending-queues-title" className="space-y-3">
      <h2 id="pending-queues-title" className="text-lg font-semibold text-foreground">
        Pending queues
      </h2>
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <QueueCard key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}
