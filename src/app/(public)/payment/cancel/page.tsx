import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PaymentResultCard } from "@/components/shared/payment-result-card";
import { Button } from "@/components/ui/button";
import { resolvePayment } from "@/lib/api/paymentServer";
import { PAYMENTS_HREF, retryHref } from "@/lib/payment-labels";
import { paymentRows, readReturnHints, returnPath } from "@/lib/payment-return";
import { requirePaymentSession } from "@/lib/payment-session";

export const metadata: Metadata = {
  title: "Payment not completed",
  robots: { index: false },
};

const REASON_TEXT: Record<string, string> = {
  cancel: "You cancelled the payment",
  failure: "The payment failed",
};

export default async function PaymentCancelPage({ searchParams }: PageProps<"/payment/cancel">) {
  const hints = readReturnHints(await searchParams);
  await requirePaymentSession(returnPath("/payment/cancel", hints));

  // The message follows `reason`, but a payment that the backend reports as PAID is never shown as cancelled.
  const lookup = await resolvePayment(hints);
  if (lookup.kind === "found" && lookup.payment.status === "PAID") {
    redirect(returnPath("/payment/success", hints));
  }

  if (lookup.kind === "denied") {
    return (
      <PaymentResultCard
        tone="neutral"
        title="You cannot view this payment"
        description={lookup.message}
        actions={
          <Button asChild>
            <Link href={PAYMENTS_HREF}>View payments</Link>
          </Button>
        }
      />
    );
  }

  const payment = lookup.kind === "found" ? lookup.payment : null;
  const retry = retryHref(
    payment?.purpose ?? hints.purpose,
    payment?.application?.id ?? hints.ref,
  );

  return (
    <PaymentResultCard
      tone="neutral"
      title={(hints.reason && REASON_TEXT[hints.reason]) || "Something went wrong"}
      description="No payment was completed. You can try again."
      rows={payment ? paymentRows(payment, { paid: false }) : undefined}
      actions={
        <>
          <Button asChild>
            <Link href={retry}>Try again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={PAYMENTS_HREF}>View payments</Link>
          </Button>
        </>
      }
    />
  );
}
