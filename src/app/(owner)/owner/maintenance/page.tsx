import type { Metadata } from "next";
import { Suspense } from "react";

import { MaintenanceSkeleton } from "./_components/maintenance-skeleton";
import { OwnerMaintenanceList } from "./_components/owner-maintenance-list";

export const metadata: Metadata = {
  title: "Maintenance",
  robots: { index: false },
};

export default function OwnerMaintenancePage() {
  return (
    <Suspense fallback={<MaintenanceSkeleton />}>
      <OwnerMaintenanceList />
    </Suspense>
  );
}
