"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
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
import { toFormFailure } from "@/lib/api/formFailure";
import type { ApplicationStatus } from "@/validation/enums";
import { ReviewApplicationZodSchema } from "@/validation/application";
import { useReviewApplication } from "../../_hooks/use-owner-application-queries";

interface ReviewApplicationProps {
  applicationId: string;
  tenantName: string;
  roomName: string;
  status: ApplicationStatus;
}

/** Approve and Reject for a PENDING application. Only roles with `applications.review` see them. */
export function ReviewApplication({
  applicationId,
  tenantName,
  roomName,
  status,
}: ReviewApplicationProps) {
  const mutation = useReviewApplication(applicationId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { reason: "" },
    validators: {
      onSubmit: ({ value }) => {
        const result = ReviewApplicationZodSchema.safeParse({
          status: "REJECTED",
          rejectionReason: value.reason.trim() || undefined,
        });
        return result.success
          ? undefined
          : { fields: { reason: result.error.issues[0]?.message ?? "Enter a reason" } };
      },
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const response = await mutation.mutateAsync({
          status: "REJECTED",
          rejectionReason: value.reason.trim(),
        });
        toast.success(response.message);
        setRejectOpen(false);
        form.reset();
      } catch (error) {
        // Guard messages (not pending, not assigned) are shown exactly as the backend sent them.
        const failure = toFormFailure(error);
        setServerError(failure.message);
        toast.error(failure.message);
      }
    },
  });

  if (status !== "PENDING") return null;

  const approve = async () => {
    try {
      await mutation.mutateAsync({ status: "APPROVED" });
      toast.success("The tenant can now pay the deposit; a lease is created when the payment succeeds.");
    } catch (error) {
      // For example "This room has no available bed left for another applicant".
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <Can permission="applications.review">
      <ConfirmDialog
        title="Approve this application?"
        description={`${tenantName} is told by email and in the app that their application for ${roomName} was approved, and can then pay the booking deposit. A lease is created only when that payment succeeds. When you approve, the room is checked for a free bed.`}
        confirmLabel="Approve application"
        onConfirm={approve}
        trigger={
          <Button type="button">
            <Check aria-hidden="true" />
            Approve
          </Button>
        }
      />

      <Button
        type="button"
        variant="outline"
        className="text-error-text"
        onClick={() => {
          setServerError(null);
          setRejectOpen(true);
        }}
      >
        <X aria-hidden="true" />
        Reject
      </Button>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          if (mutation.isPending) return;
          setRejectOpen(open);
          if (!open) form.reset();
        }}
      >
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
              <DialogTitle>Reject this application?</DialogTitle>
              <DialogDescription>
                {`${tenantName}'s application for ${roomName} is marked as rejected. This cannot be undone.`}
              </DialogDescription>
            </DialogHeader>

            <FormError message={serverError} />

            <form.Field name="reason">
              {(field) => (
                <FormField
                  id="rejection-reason"
                  label="Reason"
                  required
                  helper="The tenant will see this reason"
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
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setRejectOpen(false)}
              >
                Keep application
              </Button>
              <Button type="submit" variant="destructive" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Reject application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Can>
  );
}
