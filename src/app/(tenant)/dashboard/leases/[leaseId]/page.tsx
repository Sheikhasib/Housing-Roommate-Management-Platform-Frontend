import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { getLeaseForTenant } from "@/lib/api/leaseServer";
import type { TenantLease } from "@/types/lease";
import { LeaseDetailView } from "./_components/lease-detail-view";

export const metadata: Metadata = {
  title: "Lease",
  robots: { index: false },
};

type Loaded = { lease: TenantLease } | { denied: string };

async function load(leaseId: string): Promise<Loaded> {
  try {
    return { lease: await getLeaseForTenant(leaseId) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    // The backend 403 message is shown as it comes; no lease data is rendered.
    if (error instanceof ApiError && error.status === 403) {
      return { denied: error.errors[0]?.message || error.message };
    }
    throw error;
  }
}

export default async function TenantLeasePage({ params }: PageProps<"/dashboard/leases/[leaseId]">) {
  const { leaseId } = await params;
  const result = await load(leaseId);

  if ("denied" in result) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You cannot open this lease"
        description={result.denied}
        action={
          <Button asChild>
            <Link href="/dashboard/leases">Back to leases</Link>
          </Button>
        }
      />
    );
  }

  return <LeaseDetailView lease={result.lease} />;
}
