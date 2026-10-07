import type { Metadata } from "next";
import { Suspense } from "react";

import { ViewingsList } from "./_components/viewings-list";
import { ViewingsSkeleton } from "./_components/viewings-skeleton";

export const metadata: Metadata = {
  title: "My viewing requests",
  robots: { index: false },
};

export default function TenantViewingsPage() {
  return (
    <Suspense fallback={<ViewingsSkeleton />}>
      <ViewingsList />
    </Suspense>
  );
}
