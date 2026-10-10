"use client";

import { useId, useState } from "react";
import { AlertTriangle, Hourglass, Info, ShieldCheck } from "lucide-react";
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
import { ApiError } from "@/lib/api/apiError";
import { resolvePendingSettlement } from "@/lib/api/adminClient";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { PendingSettlementRow } from "@/types/admin";
import { optionalText, ResolvePendingSettlementZodSchema } from "@/validation/admin";
import { usePendingSettlements, useRefreshAdminData } from "../../_hooks/use-admin-queries";

type Outcome = "SETTLED" | "NOT_SETTLED";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const TECHNICAL_MESSAGE =
  /duplicate key|prisma|\bP\d{4}\b|econn|etimedout|timed? ?out|unexpected|internal|undefined|\bnull\b|stack|exception|\bat\s+\S+\s+\(|\.(?:ts|js):\d+|failed to|token/i;

/** Messages the server writes for people (4xx) come through as they are; server failures and technical text do not. */
function plainSettlementError(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_ERROR;
  if (error.status >= 500) return GENERIC_ERROR;
  const message = (error.errors[0]?.message || error.message || "").trim();
  if (!message || message === "Something went wrong" || TECHNICAL_MESSAGE.test(message)) return GENERIC_ERROR;
  return message;
}

const OUTCOME_LABELS: Record<Outcome, string> = {
  SETTLED: "Money was received",
  NOT_SETTLED: "No money was received",
};

const OUTCOME_WARNINGS: Record<Outcome, string> = {
  SETTLED:
    "Choose this only if you have confirmed in the payment provider's own dashboard that the money was received. The payment will be completed.",
  NOT_SETTLED: "Choose this if no money was received. The payment will be marked as failed so the tenant can try again.",
};

function purposeLabel(purpose: string) {
  const text = purpose.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const COLUMNS: DataTableColumn<PendingSettlementRow>[] = [
  {
    key: "id",
    header: "Payment",
    wrap: true,
    cell: (payment) => <span className="font-mono text-xs break-all text-foreground">{payment.id}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    cell: (payment) => <span className="text-sm font-medium text-foreground">{formatMoney(payment.amount)}</span>,
  },
  {
    key: "purpose",
    header: "Purpose",
    cell: (payment) => <span className="text-sm text-foreground">{purposeLabel(payment.purpose)}</span>,
  },
  { key: "gateway", header: "Gateway", cell: (payment) => <Badge variant="neutral">{gatewayShortLabel(payment.gateway)}</Badge> },
  { key: "status", header: "Status", cell: (payment) => <StatusBadge status={payment.status} /> },
  {
    key: "createdAt",
    header: "Created",
    cell: (payment) => <span className="text-sm text-muted-foreground">{formatDateTime(payment.createdAt)}</span>,
  },
];

function ResolveSettlement({ payment }: { payment: PendingSettlementRow }) {
  const refresh = useRefreshAdminData();
  const outcomeLabelId = useId();
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | "">("");
  const [providerTrxId, setProviderTrxId] = useState("");
  const [note, setNote] = useState("");
  const [failure, setFailure] = useState<string | null>(null);

  const reset = () => {
    setOutcome("");
    setProviderTrxId("");
    setNote("");
    setFailure(null);
  };

  const missingTrxId = outcome === "SETTLED" && !providerTrxId.trim();
  const amount = formatMoney(payment.amount);

  const description = !outcome
    ? `Record what happened to this ${amount} payment. Choose an outcome below.`
    : outcome === "SETTLED"
      ? `You are recording that the ${amount} payment was received.`
      : `You are recording that the ${amount} payment was not received.`;

  const confirm = async () => {
    setFailure(null);
    try {
      const body = ResolvePendingSettlementZodSchema.parse({
        outcome,
        providerTrxId: optionalText(providerTrxId),
        note: optionalText(note),
      });
      const response = await resolvePendingSettlement(payment.id, body);
      toast.success(response.message);
      refresh();
    } catch (error) {
      const message = plainSettlementError(error);
      setFailure(message);
      toast.error(message);
      throw error;
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="min-h-10" onClick={() => setOpen(true)}>
        <ShieldCheck aria-hidden="true" />
        Resolve
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
        title="Resolve pending settlement"
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
              {(["SETTLED", "NOT_SETTLED"] as const).map((option) => (
                <Label
                  key={option}
                  htmlFor={`${fieldId}-${option}`}
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-normal"
                >
                  <RadioGroupItem id={`${fieldId}-${option}`} value={option} />
                  {OUTCOME_LABELS[option]}
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

          {outcome === "SETTLED" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${fieldId}-trx`}>Provider transaction id (recommended)</Label>
              <Input
                id={`${fieldId}-trx`}
                value={providerTrxId}
                onChange={(event) => setProviderTrxId(event.target.value)}
                aria-describedby={`${fieldId}-hint`}
                autoComplete="off"
              />
              <p id={`${fieldId}-hint`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Copy it from the payment provider&apos;s dashboard so this record can be matched to the real payment.
              </p>
              {missingTrxId ? (
                <p className="text-sm text-foreground" role="status">
                  You have not entered a provider transaction id. The payment will be completed without one.
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

export function PendingSettlements() {
  const { page, limit } = useUrlState();
  const query = usePendingSettlements({ page, limit });

  return query.isError && !query.data ? (
    <div className="rounded-xl border bg-card shadow-sm">
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    </div>
  ) : (
    <DataTable
      caption="Payments waiting for review"
      columns={COLUMNS}
      rows={query.data?.rows ?? []}
      getRowId={(payment) => payment.id}
      isLoading={query.isPending}
      actions={(payment) => <ResolveSettlement payment={payment} />}
      empty={{
        icon: Hourglass,
        title: "No payments are waiting for review",
        description: "Payments that stay unconfirmed for a long time show up here for you to check.",
      }}
      footer={query.data ? <Pagination meta={query.data.meta} /> : null}
    />
  );
}
