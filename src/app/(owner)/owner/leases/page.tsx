import type { Metadata } from "next";
import { Suspense } from "react";

import { LeasesSkeleton } from "@/app/(tenant)/dashboard/leases/_components/leases-skeleton";
import { OwnerLeasesList } from "./_components/owner-leases-list";

export const metadata: Metadata = {
  title: "Leases",
  robots: { index: false },
};

export default function OwnerLeasesPage() {
  return (
    <Suspense fallback={<LeasesSkeleton />}>
      <OwnerLeasesList />
    </Suspense>
  );
}
