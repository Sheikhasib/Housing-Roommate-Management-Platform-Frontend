import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { getPaymentById } from "@/lib/api/paymentServer";
import { plainPaymentError } from "@/lib/payment-labels";
import type { Payment } from "@/types/payment";
import { PaymentDetailView } from "./_components/payment-detail-view";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false },
};

type Loaded = { payment: Payment } | { denied: string };

async function load(paymentId: string): Promise<Loaded> {
  try {
    return { payment: await getPaymentById(paymentId) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    // The backend 403 message is shown as it comes; no payment data is rendered.
    if (error instanceof ApiError && error.status === 403) {
      return { denied: plainPaymentError(error) };
    }
    throw error;
  }
}

export default async function TenantPaymentPage({
  params,
}: PageProps<"/dashboard/payments/[paymentId]">) {
  const { paymentId } = await params;
  const result = await load(paymentId);

  if ("denied" in result) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You cannot open this payment"
        description={result.denied}
        action={
          <Button asChild>
            <Link href="/dashboard/payments">Back to payments</Link>
          </Button>
        }
      />
    );
  }

  return <PaymentDetailView payment={result.payment} />;
}
