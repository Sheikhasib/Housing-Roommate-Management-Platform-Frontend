import type { Metadata } from "next";
import { Suspense } from "react";

import { OwnerViewingsList } from "./_components/owner-viewings-list";
import { ViewingsSkeleton } from "./_components/viewings-skeleton";

export const metadata: Metadata = {
  title: "Viewings",
  robots: { index: false },
};

export default function OwnerViewingsPage() {
  return (
    <Suspense fallback={<ViewingsSkeleton />}>
      <OwnerViewingsList />
    </Suspense>
  );
}
