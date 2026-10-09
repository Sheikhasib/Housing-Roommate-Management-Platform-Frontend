"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

import { FormError, FormField, SubmitButton, firstError } from "@/components/shared/form-field";
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
import { toFormFailure } from "@/lib/api/formFailure";
import {
  MESSAGE_LIMIT,
  toSendPayload,
  validateSendForm,
  type SendRequestFormValues,
} from "@/validation/roommate";
import { useSendRoommateRequest } from "../_hooks/use-roommate-queries";

const FIELDS = ["message", "receiverTenantProfileId"] as const;

interface RequestFlowProps {
  receiverId: string;
  receiverName: string;
  onClose: () => void;
  onSent: () => void;
}

function RequestFlow({ receiverId, receiverName, onClose, onSent }: RequestFlowProps) {
  const feedback = useActionFeedback();
  const send = useSendRoommateRequest();
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const defaultValues: SendRequestFormValues = { message: "" };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateSendForm(receiverId, value);
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const payload = toSendPayload(receiverId, value);
      if (!payload) return;
      try {
        const response = await send.mutateAsync(payload);
        setSentMessage(response.message);
        toast.success(response.message);
        onSent();
      } catch (error) {
        // Guard messages (yourself, not found, already requested) show as the server wrote them.
        feedback.handleFailure(toFormFailure(error), FIELDS);
      }
    },
  });

  if (sentMessage) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            {sentMessage}
          </DialogTitle>
          <DialogDescription>
            {receiverName} can accept or decline. You can follow the answer in the Requests tab.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
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
        <DialogTitle>Send a request to {receiverName}</DialogTitle>
        <DialogDescription>
          Add a short note if you like. Your email and phone are not shared.
        </DialogDescription>
      </DialogHeader>

      <FormError message={feedback.formError} />

      <form.Field name="message">
        {(field) => (
          <FormField
            id={`roommate-message-${receiverId}`}
            label="Message (optional)"
            helper={`${field.state.value.length} of ${MESSAGE_LIMIT} characters`}
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.message}
          >
            {(control) => (
              <Textarea
                {...control}
                name="message"
                rows={4}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("message");
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <SubmitButton
              pending={isSubmitting}
              cooldownSeconds={feedback.cooldownSeconds}
              label="Send request"
              pendingLabel="Sending"
              className="sm:w-auto"
            />
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  );
}

interface SendRequestDialogProps {
  receiverId: string;
  receiverName: string;
  /** True after a request was sent from this card in this visit. */
  alreadySent: boolean;
  onSent: () => void;
}

export function SendRequestDialog({ receiverId, receiverName, alreadySent, onSent }: SendRequestDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={alreadySent}
        onClick={() => setOpen(true)}
        aria-label={alreadySent ? `Request sent to ${receiverName}` : `Send request to ${receiverName}`}
      >
        <Send aria-hidden="true" />
        {alreadySent ? "Request sent" : "Send request"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {open ? (
            <RequestFlow
              receiverId={receiverId}
              receiverName={receiverName}
              onClose={() => setOpen(false)}
              onSent={onSent}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
