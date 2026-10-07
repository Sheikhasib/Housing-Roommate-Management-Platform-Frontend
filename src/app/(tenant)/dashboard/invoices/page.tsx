import type { Metadata } from "next";
import { Suspense } from "react";

import { InvoicesList } from "./_components/invoices-list";
import { InvoicesSkeleton } from "./_components/invoices-skeleton";

export const metadata: Metadata = {
  title: "My invoices",
  robots: { index: false },
};

export default function TenantInvoicesPage() {
  return (
    <Suspense fallback={<InvoicesSkeleton />}>
      <InvoicesList />
    </Suspense>
  );
}
