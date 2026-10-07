"use client";

import { useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckCircle2, Loader2, Power } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/shared/can";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormError, FormField, firstError } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toFormFailure } from "@/lib/api/formFailure";
import {
  depositRefundNotice,
  OWNER_TERMINATION_EFFECTS,
  ownerDepositRefundNotice,
  REFUND_RESULT_LINE,
  TERMINATION_EFFECTS,
} from "@/lib/lease-refund";
import type { TenantLease, TerminateLeaseResult } from "@/types/lease";
import { TerminateLeaseZodSchema } from "@/validation/lease";
import { useTerminateLease } from "../../_hooks/use-lease-queries";

export interface TerminationOutcome {
  /** The backend's own message, shown as it came. */
  message: string;
  result: TerminateLeaseResult;
}

/** Shown after a successful termination, built only from the backend response. */
export function TerminationResultPanel({ outcome }: { outcome: TerminationOutcome }) {
  const { refund } = outcome.result;
  return (
    <section
      role="status"
      className="space-y-2 rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
        {outcome.message}
      </h2>
      {refund ? (
        <p className="text-sm text-foreground">
          Deposit refunded. Refund transaction id:{" "}
          <span className="font-medium">{refund.refundTrxId}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No refund was issued by this termination. The deposit payment status on this page shows
          whether a refund is pending.
        </p>
      )}
    </section>
  );
}

interface TerminateLeaseProps {
  lease: TenantLease;
  onTerminated: (outcome: TerminationOutcome) => void;
  /** Whose point of view the wording and the permission follow. Defaults to the tenant. */
  viewer?: "tenant" | "owner";
  /** The tenant's name, used in the owner wording. */
  tenantName?: string;
}

/**
 * Step 1: a form dialog with the required reason and the refund explanation.
 * Step 2: a final confirmation, because ending a lease cannot be undone and may involve money.
 */
export function TerminateLease({
  lease,
  onTerminated,
  viewer = "tenant",
  tenantName,
}: TerminateLeaseProps) {
  const isOwner = viewer === "owner";
  const refundNotice = isOwner ? ownerDepositRefundNotice : depositRefundNotice;
  const effects = isOwner ? OWNER_TERMINATION_EFFECTS : TERMINATION_EFFECTS;
  const mutation = useTerminateLease(lease.id);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [now, setNow] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const terminatedRef = useRef(false);

  const form = useForm({
    defaultValues: { reason: "" },
    validators: {
      onSubmit: ({ value }) => {
        const result = TerminateLeaseZodSchema.safeParse({ reason: value.reason.trim() });
        return result.success
          ? undefined
          : { fields: { reason: result.error.issues[0]?.message ?? "Enter a reason" } };
      },
    },
    onSubmit: ({ value }) => {
      setReason(value.reason.trim());
      setServerError(null);
      setFormOpen(false);
      setConfirmOpen(true);
    },
  });

  const openForm = () => {
    setNow(Date.now());
    setServerError(null);
    setFormOpen(true);
  };

  const terminate = async () => {
    setServerError(null);
    try {
      const response = await mutation.mutateAsync({ reason });
      toast.success(response.message);
      terminatedRef.current = true;
      onTerminated({ message: response.message, result: response.data });
      form.reset();
    } catch (error) {
      // 403, 409 and 502 messages are shown as the backend sent them.
      const failure = toFormFailure(error);
      setServerError(failure.message);
      toast.error(failure.message);
      throw error;
    }
  };

  return (
    <Can permission={isOwner ? "leases.terminate" : "leases.terminateOwn"}>
      {lease.status === "ACTIVE" ? (
        <Button type="button" variant="outline" className="text-error-text" onClick={openForm}>
          <Power aria-hidden="true" />
          Terminate lease
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex rounded-lg">
              <Button
                type="button"
                variant="outline"
                disabled
                aria-label="Terminate lease, not available"
              >
                <Power aria-hidden="true" />
                Terminate lease
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Only an active lease can be terminated.</TooltipContent>
        </Tooltip>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form
            noValidate
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <DialogHeader>
              <DialogTitle>Terminate this lease?</DialogTitle>
              <DialogDescription>
                {isOwner
                  ? `Tell us why you are ending the lease${tenantName ? ` of ${tenantName}` : ""} for ${lease.room.name}. You confirm in the next step.`
                  : `Tell us why you are ending your lease for ${lease.room.name}. You confirm in the next step.`}
              </DialogDescription>
            </DialogHeader>

            <FormError message={serverError} />

            <form.Field name="reason">
              {(field) => (
                <FormField
                  id="termination-reason"
                  label="Reason"
                  required
                  helper="Between 3 and 300 characters"
                  error={firstError(field.state.meta.errors)}
                >
                  {(control) => (
                    <Textarea
                      {...control}
                      name="reason"
                      rows={4}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        setServerError(null);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>

            <div className="space-y-2 rounded-lg border border-border bg-muted p-3 text-sm">
              <p className="font-medium text-foreground">{isOwner ? "About the deposit" : "About your deposit"}</p>
              <p className="text-muted-foreground">{refundNotice(lease, now)}</p>
              <p className="text-foreground">{REFUND_RESULT_LINE}</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Keep lease
              </Button>
              <Button type="submit" variant="destructive">
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          // Going back keeps what was typed, so the tenant can edit the reason.
          if (!open && !terminatedRef.current) {
            form.setFieldValue("reason", reason);
            setFormOpen(true);
          }
        }}
        title="Terminate this lease now?"
        description={`${effects} ${refundNotice(lease, now)} ${REFUND_RESULT_LINE}`}
        confirmLabel="Terminate lease"
        cancelLabel="Go back"
        destructive
        onConfirm={terminate}
      >
        <FormError message={serverError} />
        {mutation.isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {isOwner ? "Ending the lease. A refund request can take a while." : "Ending your lease. A refund request can take a while."}
          </p>
        ) : null}
      </ConfirmDialog>
    </Can>
  );
}
