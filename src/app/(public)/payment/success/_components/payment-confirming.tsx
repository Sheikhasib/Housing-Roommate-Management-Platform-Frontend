"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import {
  PaymentResultCard,
  type PaymentResultRow,
} from "@/components/shared/payment-result-card";
import { Button } from "@/components/ui/button";

const POLL_EVERY_MS = 3000;
/** About 30 seconds in total, then it stops and waits for the tenant. */
const MAX_REFRESHES = 10;

interface PaymentConfirmingProps {
  rows: PaymentResultRow[];
}

/**
 * Shown while the real payment is still PROCESSING. It asks the server page to re-read the payment
 * every few seconds, a limited number of times. It never decides the outcome itself: when the
 * backend reports PAID or another status, the page renders that state instead.
 */
export function PaymentConfirming({ rows }: PaymentConfirmingProps) {
  const router = useRouter();
  const [refreshes, setRefreshes] = useState(0);
  const [pending, startTransition] = useTransition();
  const stopped = refreshes >= MAX_REFRESHES;

  useEffect(() => {
    if (stopped) return;
    const timer = window.setTimeout(() => {
      startTransition(() => router.refresh());
      setRefreshes((count) => count + 1);
    }, POLL_EVERY_MS);
    return () => window.clearTimeout(timer);
  }, [refreshes, stopped, router]);

  const checkAgain = () => {
    startTransition(() => router.refresh());
    setRefreshes(0);
  };

  return (
    <PaymentResultCard
      tone="info"
      title="We are confirming your payment"
      description={
        stopped
          ? "Still confirming. Check again in a moment, or look at your payments later."
          : "This page updates by itself. You can keep it open."
      }
      rows={rows}
      actions={
        stopped ? (
          <Button type="button" onClick={checkAgain} disabled={pending}>
            <RotateCcw aria-hidden="true" />
            Check again
          </Button>
        ) : null
      }
    />
  );
}
