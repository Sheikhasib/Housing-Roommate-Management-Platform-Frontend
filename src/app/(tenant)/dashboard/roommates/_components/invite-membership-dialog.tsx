"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckCircle2, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { toFormFailure } from "@/lib/api/formFailure";
import type { TenantLease } from "@/types/lease";
import {
  MESSAGE_LIMIT,
  toInvitePayload,
  validateInviteForm,
  type InviteFormValues,
} from "@/validation/roommate";
import { useInviteMember } from "../_hooks/use-roommate-queries";

const FIELDS = ["leaseId", "tenantEmail", "message"] as const;

function leaseLabel(lease: TenantLease): string {
  return `${lease.room.name}, ${lease.room.property.title}`;
}

interface InviteFlowProps {
  leases: TenantLease[];
  onClose: () => void;
}

function InviteFlow({ leases, onClose }: InviteFlowProps) {
  const feedback = useActionFeedback();
  const invite = useInviteMember();
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const defaultValues: InviteFormValues = {
    leaseId: leases.length === 1 ? leases[0].id : "",
    tenantEmail: "",
    message: "",
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateInviteForm(value);
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const payload = toInvitePayload(value);
      if (!payload) return;
      try {
        const response = await invite.mutateAsync(payload);
        setSentMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        // Every guard (not verified, cap reached, already a member...) shows as the server wrote it.
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
            The invited tenant can accept or decline. You can follow the answer in this tab.
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
        <DialogTitle>Invite a roommate to your room</DialogTitle>
        <DialogDescription>
          The invited tenant must have a verified account. They can report maintenance and see the room&apos;s
          utility bills. They do not pay rent through you.
        </DialogDescription>
      </DialogHeader>

      <FormError message={feedback.formError} />

      <form.Field name="leaseId">
        {(field) => (
          <FormField
            id="invite-lease"
            label="Lease"
            required
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.leaseId}
          >
            {(control) => (
              <Select
                value={field.state.value}
                onValueChange={(value) => {
                  feedback.clearField("leaseId");
                  field.handleChange(value);
                }}
              >
                <SelectTrigger {...control} className="w-full" onBlur={field.handleBlur}>
                  <SelectValue placeholder="Choose an active lease" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((lease) => (
                    <SelectItem key={lease.id} value={lease.id}>
                      {leaseLabel(lease)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="tenantEmail">
        {(field) => (
          <FormField
            id="invite-email"
            label="Their email"
            required
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.tenantEmail}
          >
            {(control) => (
              <Input
                {...control}
                name="tenantEmail"
                type="email"
                autoComplete="off"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("tenantEmail");
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="message">
        {(field) => (
          <FormField
            id="invite-message"
            label="Message (optional)"
            helper={`${field.state.value.length} of ${MESSAGE_LIMIT} characters`}
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.message}
          >
            {(control) => (
              <Textarea
                {...control}
                name="message"
                rows={3}
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
              label="Send invitation"
              pendingLabel="Sending"
              className="sm:w-auto"
            />
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  );
}

/** Holder-only. The caller renders it only when there is at least one ACTIVE lease. */
export function InviteMembershipDialog({ leases }: { leases: TenantLease[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <UserPlus aria-hidden="true" />
        Invite a roommate
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {open ? <InviteFlow leases={leases} onClose={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
