import type { Metadata } from "next";
import { Suspense } from "react";

import { MaintenanceList } from "./_components/maintenance-list";
import { MaintenanceSkeleton } from "./_components/maintenance-skeleton";

export const metadata: Metadata = {
  title: "Maintenance",
  robots: { index: false },
};

export default function TenantMaintenancePage() {
  return (
    <Suspense fallback={<MaintenanceSkeleton />}>
      <MaintenanceList />
    </Suspense>
  );
}
