import type { Metadata } from "next";
import { Suspense } from "react";

import { RoleGuard } from "@/components/shared/can";
import { PageHeader } from "@/components/shared/page-header";
import { RoommatesSkeleton } from "./_components/roommates-skeleton";
import { RoommatesTabs } from "./_components/roommates-tabs";

export const metadata: Metadata = {
  title: "Roommates",
  robots: { index: false },
};

export default function TenantRoommatesPage() {
  return (
    <RoleGuard roles={["TENANT"]}>
      <div className="space-y-6">
        <PageHeader
          title="Roommates"
          description="Find tenants who fit you, send requests and answer the ones you receive."
        />
        <Suspense fallback={<RoommatesSkeleton />}>
          <RoommatesTabs />
        </Suspense>
      </div>
    </RoleGuard>
  );
}
