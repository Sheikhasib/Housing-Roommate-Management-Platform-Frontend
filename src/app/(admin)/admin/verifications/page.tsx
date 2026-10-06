import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { VerificationsSkeleton } from "./_components/verifications-skeleton";
import { VerificationsTabs } from "./_components/verifications-tabs";

export const metadata: Metadata = {
  title: "Verifications",
  robots: { index: false },
};

export default function AdminVerificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifications"
        description="Review identity and business documents from owners and tenants."
      />
      <Suspense fallback={<VerificationsSkeleton />}>
        <VerificationsTabs />
      </Suspense>
    </div>
  );
}
