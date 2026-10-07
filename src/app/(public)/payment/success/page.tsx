import type { Metadata } from "next";
import Link from "next/link";

import { PaymentResultCard } from "@/components/shared/payment-result-card";
import { Button } from "@/components/ui/button";
import { resolvePayment } from "@/lib/api/paymentServer";
import {
  nextStepHref,
  PAYMENT_PURPOSE_LABELS,
  PAYMENTS_HREF,
  retryHref,
} from "@/lib/payment-labels";
import { paymentRows, readReturnHints, returnPath } from "@/lib/payment-return";
import { requirePaymentSession } from "@/lib/payment-session";
import { PaymentConfirming } from "./_components/payment-confirming";

export const metadata: Metadata = {
  title: "Payment result",
  robots: { index: false },
};

export default async function PaymentSuccessPage({ searchParams }: PageProps<"/payment/success">) {
  const hints = readReturnHints(await searchParams);
  await requirePaymentSession(returnPath("/payment/success", hints));

  // The URL is only a hint. What is shown comes from the payment the backend returns.
  const lookup = await resolvePayment(hints);

  if (lookup.kind !== "found") {
    return (
      <PaymentResultCard
        tone="neutral"
        title={lookup.kind === "denied" ? "You cannot view this payment" : "We could not find this payment"}
        description={
          lookup.message ??
          (lookup.kind === "denied"
            ? undefined
            : "Open your payments to see the latest status of every payment you made.")
        }
        actions={
          <Button asChild>
            <Link href={PAYMENTS_HREF}>View payments</Link>
          </Button>
        }
      />
    );
  }

  const { payment } = lookup;

  if (payment.status === "PAID") {
    const next = nextStepHref(payment.purpose, payment.application?.id ?? hints.ref);
    return (
      <PaymentResultCard
        tone="success"
        title="Payment received"
        description={`Your ${PAYMENT_PURPOSE_LABELS[payment.purpose].toLowerCase()} payment went through.`}
        rows={paymentRows(payment, { paid: true })}
        actions={
          <>
            <Button asChild>
              <Link href={next.href}>{next.label}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={PAYMENTS_HREF}>View payments</Link>
            </Button>
          </>
        }
      />
    );
  }

  if (payment.status === "PROCESSING") {
    return <PaymentConfirming rows={paymentRows(payment, { paid: false })} />;
  }

  const retry = retryHref(payment.purpose, payment.application?.id ?? hints.ref);
  const didNotComplete =
    payment.status === "FAILED" || payment.status === "CANCELLED" || payment.status === "UNPAID";

  return (
    <PaymentResultCard
      tone="neutral"
      title={
        payment.status === "FAILED"
          ? "The payment did not go through"
          : payment.status === "CANCELLED"
            ? "The payment was cancelled"
            : "This payment is not completed"
      }
      description={
        didNotComplete
          ? "No money was taken for this attempt. You can try again."
          : `The status of this payment is ${payment.status.replaceAll("_", " ").toLowerCase()}.`
      }
      rows={paymentRows(payment, { paid: false })}
      actions={
        <>
          <Button asChild>
            <Link href={retry}>{didNotComplete ? "Try again" : "Go back"}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={PAYMENTS_HREF}>View payments</Link>
          </Button>
        </>
      }
    />
  );
}
