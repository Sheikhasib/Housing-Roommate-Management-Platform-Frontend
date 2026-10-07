"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Check, CheckCheck, Loader2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/apiError";
import { plainViewingError } from "@/lib/viewing-labels";
import type { OwnerViewing } from "@/types/viewing";
import {
  REJECTION_REASON_REQUIRED,
  todayDateValue,
  toScheduledDateTime,
  UpdateViewingStatusZodSchema,
  validateApproveForm,
  type ApproveFormValues,
  type UpdateViewingStatusPayload,
} from "@/validation/viewing";
import { useDecideViewing, useIsDeciding } from "../_hooks/use-owner-viewing-queries";

type Decision = (body: UpdateViewingStatusPayload) => Promise<{ message: string }>;

interface DialogProps {
  tenantName: string;
  roomName: string;
  decide: Decision;
  onClose: () => void;
}

/**
 * Shows the server's message as it came. A 409 means someone else decided first: the list has
 * already been reloaded, so the dialog closes instead of asking for a retry.
 */
function reportFailure(error: unknown, onClose: () => void): string {
  const message = plainViewingError(error);
  toast.error(message);
  if (error instanceof ApiError && error.status === 409) onClose();
  return message;
}

function ApproveDialog({ tenantName, roomName, decide, onClose }: DialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm({
    defaultValues: { date: "", time: "" } satisfies ApproveFormValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateApproveForm(value);
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const scheduledDateTime = toScheduledDateTime(value);
      const body = UpdateViewingStatusZodSchema.parse({
        status: "APPROVED",
        ...(scheduledDateTime ? { scheduledDateTime } : {}),
      });
      setPending(true);
      try {
        const response = await decide(body);
        toast.success(response.message);
        onClose();
      } catch (error) {
        setServerError(reportFailure(error, onClose));
      } finally {
        setPending(false);
      }
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
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
            <DialogTitle>Approve this viewing?</DialogTitle>
            <DialogDescription>
              {`${tenantName} is told by email and in the app that they can see ${roomName}. You can set a date and time now, or leave them empty.`}
            </DialogDescription>
          </DialogHeader>

          <FormError message={serverError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="date">
              {(field) => (
                <FormField
                  id="viewing-scheduled-date"
                  label="Date (optional)"
                  error={firstError(field.state.meta.errors)}
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="date"
                      name="date"
                      min={todayDateValue()}
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
            <form.Field name="time">
              {(field) => (
                <FormField
                  id="viewing-scheduled-time"
                  label="Time (optional)"
                  error={firstError(field.state.meta.errors)}
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="time"
                      name="time"
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
          </div>
          <p className="text-sm text-muted-foreground">
            Leave the date and time empty to approve for the day the tenant asked for.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Approve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ tenantName, roomName, decide, onClose }: DialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm({
    defaultValues: { reason: "" },
    validators: {
      onSubmit: ({ value }) =>
        value.reason.trim() ? undefined : { fields: { reason: REJECTION_REASON_REQUIRED } },
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const body = UpdateViewingStatusZodSchema.parse({
        status: "REJECTED",
        rejectionReason: value.reason.trim(),
      });
      setPending(true);
      try {
        const response = await decide(body);
        toast.success(response.message);
        onClose();
      } catch (error) {
        setServerError(reportFailure(error, onClose));
      } finally {
        setPending(false);
      }
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
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
            <DialogTitle>Reject this viewing?</DialogTitle>
            <DialogDescription>
              {`${tenantName} is told by email and in the app that they cannot see ${roomName}, and they can read your reason. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          <FormError message={serverError} />

          <form.Field name="reason">
            {(field) => (
              <FormField
                id="viewing-rejection-reason"
                label="Reason"
                required
                helper="Say why, so the tenant knows what to do next."
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

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              Keep request
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Only the moves the backend allows for the row's status: PENDING decides, APPROVED completes, the rest show nothing. */
export function ViewingDecision({ viewing }: { viewing: OwnerViewing }) {
  const [chosen, setChosen] = useState<"approve" | "reject" | null>(null);
  const mutation = useDecideViewing(viewing.id);
  const deciding = useIsDeciding(viewing.id);

  if (viewing.status !== "PENDING" && viewing.status !== "APPROVED") return null;

  const tenantName = viewing.tenantProfile?.name ?? "The tenant";
  const roomName = viewing.room?.name ?? "the room";
  const decide: Decision = (body) => mutation.mutateAsync(body);
  const close = () => setChosen(null);

  const complete = async () => {
    try {
      const response = await mutation.mutateAsync({ status: "COMPLETED" });
      toast.success(response.message);
    } catch (error) {
      reportFailure(error, () => undefined);
      // A 409 means someone else decided first: the list reloads and the dialog closes.
      if (!(error instanceof ApiError && error.status === 409)) throw error;
    }
  };

  return (
    <Can permission="viewings.decide">
      <div className="flex flex-wrap justify-end gap-2">
        {viewing.status === "PENDING" ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={deciding}
              onClick={() => setChosen("approve")}
              aria-label={`Approve viewing request from ${tenantName}`}
            >
              {deciding ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-error-text"
              disabled={deciding}
              onClick={() => setChosen("reject")}
              aria-label={`Reject viewing request from ${tenantName}`}
            >
              <X aria-hidden="true" />
              Reject
            </Button>
          </>
        ) : (
          <ConfirmDialog
            title="Mark this viewing as completed?"
            description={`Use this once ${tenantName} has seen ${roomName}. They are told by email and in the app. It cannot be moved back.`}
            confirmLabel="Mark as completed"
            onConfirm={complete}
            trigger={
              <Button
                type="button"
                size="sm"
                disabled={deciding}
                aria-label={`Mark the viewing for ${tenantName} as completed`}
              >
                {deciding ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCheck aria-hidden="true" />
                )}
                Complete
              </Button>
            }
          />
        )}
      </div>

      {chosen === "approve" ? (
        <ApproveDialog tenantName={tenantName} roomName={roomName} decide={decide} onClose={close} />
      ) : null}
      {chosen === "reject" ? (
        <RejectDialog tenantName={tenantName} roomName={roomName} decide={decide} onClose={close} />
      ) : null}
    </Can>
  );
}
