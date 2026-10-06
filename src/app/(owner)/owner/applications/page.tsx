import type { Metadata } from "next";
import { Suspense } from "react";

import { ApplicationsSkeleton } from "@/app/(tenant)/dashboard/applications/_components/applications-skeleton";
import { OwnerApplicationsList } from "./_components/owner-applications-list";

export const metadata: Metadata = {
  title: "Applications",
  robots: { index: false },
};

export default function OwnerApplicationsPage() {
  return (
    <Suspense fallback={<ApplicationsSkeleton />}>
      <OwnerApplicationsList />
    </Suspense>
  );
}
