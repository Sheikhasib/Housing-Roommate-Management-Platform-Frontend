import type { Metadata } from "next";
import { Suspense } from "react";

import { PaymentsList } from "./_components/payments-list";
import { PaymentsSkeleton } from "./_components/payments-skeleton";

export const metadata: Metadata = {
  title: "My payments",
  robots: { index: false },
};

export default function TenantPaymentsPage() {
  return (
    <Suspense fallback={<PaymentsSkeleton />}>
      <PaymentsList />
    </Suspense>
  );
}
