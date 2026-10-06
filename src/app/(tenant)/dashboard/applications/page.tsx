import type { Metadata } from "next";
import { Suspense } from "react";

import { ApplicationsList } from "./_components/applications-list";
import { ApplicationsSkeleton } from "./_components/applications-skeleton";

export const metadata: Metadata = {
  title: "My applications",
  robots: { index: false },
};

export default function TenantApplicationsPage() {
  return (
    <Suspense fallback={<ApplicationsSkeleton />}>
      <ApplicationsList />
    </Suspense>
  );
}
