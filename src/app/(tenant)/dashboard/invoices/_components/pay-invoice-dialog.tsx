"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { GatewayButtons } from "@/components/shared/gateway-buttons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useGateways } from "@/hooks/useGateways";
import { useTenantProfile } from "@/hooks/useProfile";
import { formatDate, formatMoney } from "@/lib/format";
import type { TenantInvoice } from "@/types/invoice";
import { startInvoicePaymentAction } from "../_actions/start-invoice-payment-action";
import { useRefreshInvoices } from "../_hooks/use-invoice-queries";

/** The backend 403 text for an unverified tenant, kept verbatim. */
const NOT_VERIFIED_MESSAGE =
  "Your tenant account is not verified yet. Please complete identity verification before paying";

interface PayInvoiceDialogProps {
  invoice: TenantInvoice;
  /** "Try again" after a failed or cancelled payment, "Pay" otherwise. */
  retry: boolean;
}

/**
 * The Pay action of one UNPAID invoice. The gateway buttons come from the backend list; only the gateway
 * is sent to start the payment, so the amount shown here is for information and the backend decides it.
 */
export function PayInvoiceDialog({ invoice, retry }: PayInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [pendingGateway, setPendingGateway] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const gateways = useGateways();
  const profile = useTenantProfile(open);
  const refresh = useRefreshInvoices();

  const notVerified = profile.data !== undefined && profile.data.verificationStatus !== "APPROVED";
  const busy = pendingGateway !== null;

  const pay = (gateway: string) => {
    setFormError(null);
    setPendingGateway(gateway);
    startTransition(async () => {
      // On success the action redirects the browser to the gateway and this never returns.
      const result = await startInvoicePaymentAction({ invoiceId: invoice.id, gateway });
      setPendingGateway(null);
      setFormError(result.message);
      toast.error(result.message);
      // A 409 means the state changed (already paid, or a payment is in progress): show the real state.
      if (result.status === 409) refresh();
    });
  };

  const onOpenChange = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    if (!next) setFormError(null);
  };

  const label = `${retry ? "Try again" : "Pay"} for ${invoice.room.name}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" aria-label={label}>
          {retry ? "Try again" : "Pay"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay invoice</DialogTitle>
          <DialogDescription>
            {invoice.room.name}, {invoice.room.property.title}. Choose how you want to pay.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted p-4 text-sm">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Amount</dt>
            <dd className="font-semibold text-foreground">{formatMoney(invoice.amount)}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Due date</dt>
            <dd className="font-semibold text-foreground">{formatDate(invoice.dueDate)}</dd>
          </div>
        </dl>

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

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
