"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Check, FileSearch, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormError, FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { VerificationDocuments } from "@/components/shared/verification-documents";
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
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { reviewOwner, reviewTenant, type ReviewBody } from "@/lib/api/adminClient";
import { toFormFailure } from "@/lib/api/formFailure";
import type { VerificationDocument } from "@/types/profile";
import {
  optionalText,
  ReviewTenantVerificationZodSchema,
  VerifyOwnerZodSchema,
} from "@/validation/admin";
import { errorMessage, useRefreshAdminData } from "../../_hooks/use-admin-queries";

export type ReviewKind = "tenant" | "owner";

interface ReviewActionsProps {
  kind: ReviewKind;
  profileId: string;
  applicantName: string;
  documents: readonly VerificationDocument[];
  /** Only PENDING items can be reviewed; the backend answers 409 otherwise. */
  reviewable: boolean;
}

function validateBody(kind: ReviewKind, profileId: string, body: ReviewBody) {
  return kind === "tenant"
    ? ReviewTenantVerificationZodSchema.safeParse(body)
    : VerifyOwnerZodSchema.safeParse({ ownerProfileId: profileId, ...body });
}

function submitReview(kind: ReviewKind, profileId: string, body: ReviewBody) {
  return kind === "tenant" ? reviewTenant(profileId, body) : reviewOwner(profileId, body);
}

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ReviewKind;
  profileId: string;
  applicantName: string;
}

function RejectDialog({ open, onOpenChange, kind, profileId, applicantName }: RejectDialogProps) {
  const feedback = useActionFeedback();
  const refresh = useRefreshAdminData();
  const reasonId = `reject-reason-${profileId}`;

  const toBody = (rejectionReason: string): ReviewBody => ({
    verificationStatus: "REJECTED",
    rejectionReason: optionalText(rejectionReason),
  });

  const form = useForm({
    defaultValues: { rejectionReason: "" },
    validators: {
      onSubmit: ({ value }) => {
        const result = validateBody(kind, profileId, toBody(value.rejectionReason));
        if (result.success) return undefined;
        const message = result.error.issues[0]?.message ?? "Enter a reason";
        return { fields: { rejectionReason: message } };
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      try {
        const response = await submitReview(kind, profileId, toBody(value.rejectionReason));
        toast.success(response.message);
        onOpenChange(false);
        refresh();
      } catch (error) {
        feedback.handleFailure(toFormFailure(error), ["rejectionReason"]);
      }
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      feedback.reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <DialogTitle>Reject {applicantName}?</DialogTitle>
            <DialogDescription>
              The {kind} is told by email and notification that the verification was rejected, with this
              reason. The decision cannot be changed from here.
            </DialogDescription>
          </DialogHeader>

          <FormError message={feedback.formError} />

          <form.Field name="rejectionReason">
            {(field) => (
              <FormField
                id={reasonId}
                label="Rejection reason"
                required
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.rejectionReason}
              >
                {(control) => (
                  <Textarea
                    {...control}
                    name="rejectionReason"
                    rows={4}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("rejectionReason");
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            )}
          </form.Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <SubmitButton
                  pending={isSubmitting}
                  cooldownSeconds={feedback.cooldownSeconds}
                  label="Reject"
                  pendingLabel="Rejecting"
                  className="sm:w-auto"
                />
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewActions({
  kind,
  profileId,
  applicantName,
  documents,
  reviewable,
}: ReviewActionsProps) {
  const refresh = useRefreshAdminData();
  const [viewing, setViewing] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const approve = async () => {
    try {
      const response = await submitReview(kind, profileId, { verificationStatus: "APPROVED" });
      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setViewing(true)}>
        <FileSearch aria-hidden="true" />
        Documents
        <span className="sr-only"> for {applicantName}</span>
      </Button>

      {reviewable ? (
        <>
          <ConfirmDialog
            title={`Approve ${applicantName}?`}
            description={`${applicantName} is marked as verified and is told by email and notification.`}
            confirmLabel="Approve"
            onConfirm={approve}
            trigger={
              <Button type="button" size="sm">
                <Check aria-hidden="true" />
                Approve
                <span className="sr-only"> {applicantName}</span>
              </Button>
            }
          />
          <Button type="button" variant="destructive" size="sm" onClick={() => setRejecting(true)}>
            <X aria-hidden="true" />
            Reject
            <span className="sr-only"> {applicantName}</span>
          </Button>
          <RejectDialog
            open={rejecting}
            onOpenChange={setRejecting}
            kind={kind}
            profileId={profileId}
            applicantName={applicantName}
          />
        </>
      ) : null}

      <Dialog open={viewing} onOpenChange={setViewing}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents from {applicantName}</DialogTitle>
            <DialogDescription>
              Images open full size in a new tab. PDFs open in a new tab.
            </DialogDescription>
          </DialogHeader>
          {documents.length > 0 ? (
            <VerificationDocuments documents={documents} />
          ) : (
            <p className="text-sm text-muted-foreground">No documents were uploaded.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
