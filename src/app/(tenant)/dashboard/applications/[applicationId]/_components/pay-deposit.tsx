"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { AlertCircle, Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/shared/can";
import { ErrorState } from "@/components/shared/error-state";
import { GatewayButtons } from "@/components/shared/gateway-buttons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGateways } from "@/hooks/useGateways";
import { useTenantProfile } from "@/hooks/useProfile";
import { formatMoney } from "@/lib/format";
import type { TenantApplication } from "@/types/application";
import { useRefreshApplications } from "../../_hooks/use-application-queries";
import { startDepositAction } from "../_actions/start-deposit-action";

/** Payment states in which no new deposit session may start (the backend answers 409). */
const SETTLED_OR_REFUNDING = ["PAID", "REFUND_PENDING", "REFUNDED"] as const;

/** The backend 403 text for an unverified tenant, kept verbatim. */
const NOT_VERIFIED_MESSAGE =
  "Your tenant account is not verified yet. Please complete identity verification before paying";

interface PayDepositProps {
  application: TenantApplication;
  /** Shown to the tenant only. The backend decides the amount that is charged. */
  amount: string;
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="pay-deposit-title"
      className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      {children}
    </section>
  );
}

function ProcessingCard({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const refresh = useRefreshApplications(applicationId);
  const [pending, startTransition] = useTransition();

  const checkAgain = () => {
    refresh();
    startTransition(() => router.refresh());
  };

  return (
    <SectionCard>
      <div className="flex items-start gap-3" role="status">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-info-bg text-info">
          <Clock className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 id="pay-deposit-title" className="text-lg font-semibold text-foreground">
            A payment is being confirmed
          </h2>
          <p className="text-sm text-muted-foreground">
            Your deposit payment has been started and is waiting for confirmation.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" onClick={checkAgain} disabled={pending}>
        <RotateCcw className={pending ? "animate-spin" : undefined} aria-hidden="true" />
        Check again
      </Button>
    </SectionCard>
  );
}

function PayDepositForm({ application, amount }: PayDepositProps) {
  const { id: applicationId } = application;
  const lastAttemptFailed =
    application.payment?.status === "FAILED" || application.payment?.status === "CANCELLED";

  const gateways = useGateways();
  const profile = useTenantProfile(true);
  const refresh = useRefreshApplications(applicationId);
  const [pendingGateway, setPendingGateway] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const notVerified =
    profile.data !== undefined && profile.data.verificationStatus !== "APPROVED";

  const pay = (gateway: string) => {
    setFormError(null);
    setPendingGateway(gateway);
    startTransition(async () => {
      // On success the action redirects the browser to the gateway and this never returns.
      const result = await startDepositAction({ applicationId, gateway });
      setPendingGateway(null);
      setFormError(result.message);
      toast.error(result.message);
      // A 409 means the payment state changed (for example one is already in progress): show the real state.
      if (result.status === 409) refresh();
    });
  };

  return (
    <SectionCard>
      <div className="space-y-1">
        <h2 id="pay-deposit-title" className="text-lg font-semibold text-foreground">
          Pay deposit
        </h2>
        <p className="text-sm text-muted-foreground">
          Booking deposit:{" "}
          <span className="font-semibold text-foreground">{formatMoney(amount)}</span>. Your lease
          is created when the payment succeeds.
        </p>
        {lastAttemptFailed ? (
          <p className="text-sm text-foreground">
            Your last payment was cancelled or did not go through. You can try again or choose
            another method.
          </p>
        ) : null}
      </div>

      {notVerified ? (
        <div className="flex items-start gap-2 text-sm text-foreground" role="note">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p>
            {NOT_VERIFIED_MESSAGE}.{" "}
            <Link href="/dashboard/profile" className="font-medium text-primary hover:underline">
              Go to your profile
            </Link>
          </p>
        </div>
      ) : null}

      {gateways.isPending ? (
        <div className="flex flex-col gap-2 sm:flex-row" aria-busy="true">
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
      ) : gateways.isError ? (
        <ErrorState
          error={gateways.error}
          title="Payment methods did not load"
          onRetry={() => void gateways.refetch()}
          className="py-4"
        />
      ) : gateways.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No payment method is available right now. Try again later.
        </p>
      ) : (
        <GatewayButtons
          gateways={gateways.data}
          pendingGateway={pendingGateway}
          disabled={notVerified}
          onSelect={pay}
        />
      )}

      {formError ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-error-text">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">Sandbox payments, no real money.</p>
    </SectionCard>
  );
}

/**
 * The deposit section of the tenant application page. Shown for an APPROVED application without a lease:
 * the pay buttons when there is no payment or the last one failed or was cancelled, and a
 * "being confirmed" card while a payment is PROCESSING. Nothing shows once a payment is PAID or refunded.
 */
export function PayDeposit({ application, amount }: PayDepositProps) {
  if (application.status !== "APPROVED" || application.lease) return null;

  const paymentStatus = application.payment?.status;
  if (paymentStatus && (SETTLED_OR_REFUNDING as readonly string[]).includes(paymentStatus)) {
    return null;
  }

  return (
    <Can permission="payments.pay">
      {paymentStatus === "PROCESSING" ? (
        <ProcessingCard applicationId={application.id} />
      ) : (
        <PayDepositForm application={application} amount={amount} />
      )}
    </Can>
  );
}
