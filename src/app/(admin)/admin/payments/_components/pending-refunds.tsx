"use client";

import { useId, useState } from "react";
import { AlertTriangle, Info, ReceiptText, Wallet } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { gatewayShortLabel } from "@/lib/payment-labels";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useUrlState } from "@/hooks/useUrlState";
import { resolvePendingRefund } from "@/lib/api/adminClient";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { PendingRefundRow } from "@/types/admin";
import { optionalText, ResolvePendingRefundZodSchema } from "@/validation/admin";
import { errorMessage, usePendingRefunds, useRefreshAdminData } from "../../_hooks/use-admin-queries";

type Outcome = "REFUNDED" | "NOT_REFUNDED";

const OUTCOME_WARNINGS: Record<Outcome, string> = {
  REFUNDED:
    "Only choose this if you have confirmed in the gateway portal that the refund went through. This records it; it does not send money.",
  NOT_REFUNDED: "The payment goes back to Paid so the termination can be retried.",
};

const COLUMNS: DataTableColumn<PendingRefundRow>[] = [
  {
    key: "id",
    header: "Payment",
    cell: (payment) => <span className="font-mono text-xs break-all text-foreground">{payment.id}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    cell: (payment) => <span className="text-sm font-medium text-foreground">{formatMoney(payment.amount)}</span>,
  },
  { key: "gateway", header: "Gateway", cell: (payment) => <Badge variant="neutral">{gatewayShortLabel(payment.gateway)}</Badge> },
  { key: "status", header: "Status", cell: (payment) => <StatusBadge status={payment.status} /> },
  {
    key: "createdAt",
    header: "Created",
    cell: (payment) => <span className="text-sm text-muted-foreground">{formatDateTime(payment.createdAt)}</span>,
  },
  {
    key: "updatedAt",
    header: "Waiting since",
    cell: (payment) => <span className="text-sm text-muted-foreground">{formatDateTime(payment.updatedAt)}</span>,
  },
];

function ResolveRefund({ payment }: { payment: PendingRefundRow }) {
  const refresh = useRefreshAdminData();
  const outcomeLabelId = useId();
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | "">("");
  const [refundTrxId, setRefundTrxId] = useState("");
  const [note, setNote] = useState("");
  const [failure, setFailure] = useState<string | null>(null);

  const reset = () => {
    setOutcome("");
    setRefundTrxId("");
    setNote("");
    setFailure(null);
  };

  const missingTrxId = outcome === "REFUNDED" && !refundTrxId.trim();
  const amount = formatMoney(payment.amount);

  const description = !outcome
    ? `Record what happened to the ${amount} refund for this payment. Choose an outcome below.`
    : outcome === "REFUNDED"
      ? `You are recording that the ${amount} refund was completed. The payment becomes Refunded and the tenant is notified. A lease that is still active can then be terminated without a second refund.`
      : `You are recording that the ${amount} refund did not happen. The payment becomes Paid again, the tenant is notified, and the lease termination can be retried.`;

  const confirm = async () => {
    setFailure(null);
    try {
      const body = ResolvePendingRefundZodSchema.parse({
        outcome,
        refundTrxId: optionalText(refundTrxId),
        note: optionalText(note),
      });
      const response = await resolvePendingRefund(payment.id, body);
      toast.success(response.message);
      refresh();
    } catch (error) {
      // Show the message from the backend as it comes, for example the 409 about an already reconciled payment.
      const message = errorMessage(error);
      setFailure(message);
      toast.error(message);
      throw error;
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="min-h-10" onClick={() => setOpen(true)}>
        <Wallet aria-hidden="true" />
        Resolve
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
        title="Resolve pending refund"
        description={description}
        confirmLabel="Record outcome"
        confirmDisabled={!outcome}
        onConfirm={confirm}
      >
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <p id={outcomeLabelId} className="text-sm font-medium text-foreground">
              Outcome
            </p>
            <RadioGroup
              aria-labelledby={outcomeLabelId}
              value={outcome}
              onValueChange={(value) => setOutcome(value as Outcome)}
              className="gap-2"
            >
              {(["REFUNDED", "NOT_REFUNDED"] as const).map((option) => (
                <Label
                  key={option}
                  htmlFor={`${fieldId}-${option}`}
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-normal"
                >
                  <RadioGroupItem id={`${fieldId}-${option}`} value={option} />
                  {option === "REFUNDED" ? "Refunded" : "Not refunded"}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {outcome ? (
            <Alert>
              <AlertTriangle aria-hidden="true" />
              <AlertDescription>{OUTCOME_WARNINGS[outcome]}</AlertDescription>
            </Alert>
          ) : null}

          {outcome === "REFUNDED" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${fieldId}-trx`}>Refund transaction id (recommended)</Label>
              <Input
                id={`${fieldId}-trx`}
                value={refundTrxId}
                onChange={(event) => setRefundTrxId(event.target.value)}
                aria-describedby={`${fieldId}-hint`}
                autoComplete="off"
              />
              <p id={`${fieldId}-hint`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Copy it from the gateway portal. It is the only link between this record and the real refund.
              </p>
              {missingTrxId ? (
                <p className="text-sm text-foreground" role="status">
                  You have not entered a refund transaction id. The refund will be recorded without one.
                </p>
              ) : null}
            </div>
          ) : null}

          {outcome ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${fieldId}-note`}>Note (optional)</Label>
              <Textarea
                id={`${fieldId}-note`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Add a note for the audit log"
              />
            </div>
          ) : null}

          {failure ? (
            <Alert variant="destructive" role="alert">
              <AlertTriangle aria-hidden="true" />
              <AlertDescription>{failure}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      </ConfirmDialog>
    </>
  );
}

export function PendingRefunds() {
  const { page, limit } = useUrlState();
  const query = usePendingRefunds({ page, limit });

  return query.isError && !query.data ? (
    <div className="rounded-xl border bg-card shadow-sm">
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    </div>
  ) : (
    <DataTable
      caption="Payments waiting for refund confirmation"
      columns={COLUMNS}
      rows={query.data?.rows ?? []}
      getRowId={(payment) => payment.id}
      isLoading={query.isPending}
      actions={(payment) => <ResolveRefund payment={payment} />}
      empty={{
        icon: ReceiptText,
        title: "No refunds waiting",
        description: "Refunds with an unknown outcome show up here for you to confirm.",
      }}
      footer={query.data ? <Pagination meta={query.data.meta} /> : null}
    />
  );
}
