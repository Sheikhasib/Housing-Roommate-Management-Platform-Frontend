import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { PaymentsSkeleton } from "./_components/payments-skeleton";
import { PaymentsTabs } from "./_components/payments-tabs";

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false },
};

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every payment on the platform, and refunds and payments that are waiting for an admin to confirm the outcome."
      />
      <Suspense fallback={<PaymentsSkeleton />}>
        <PaymentsTabs />
      </Suspense>
    </div>
  );
}
