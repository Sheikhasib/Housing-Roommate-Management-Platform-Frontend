import type { Metadata } from "next";
import { Suspense } from "react";

import { OwnerInvoicesList } from "./_components/owner-invoices-list";
import { InvoicesSkeleton } from "./_components/invoices-skeleton";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false },
};

export default function OwnerInvoicesPage() {
  return (
    <Suspense fallback={<InvoicesSkeleton />}>
      <OwnerInvoicesList />
    </Suspense>
  );
}
