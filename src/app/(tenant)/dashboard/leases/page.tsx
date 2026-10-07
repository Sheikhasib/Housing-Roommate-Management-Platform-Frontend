import type { Metadata } from "next";
import { Suspense } from "react";

import { LeasesList } from "./_components/leases-list";
import { LeasesSkeleton } from "./_components/leases-skeleton";

export const metadata: Metadata = {
  title: "My leases",
  robots: { index: false },
};

export default function TenantLeasesPage() {
  return (
    <Suspense fallback={<LeasesSkeleton />}>
      <LeasesList />
    </Suspense>
  );
}
