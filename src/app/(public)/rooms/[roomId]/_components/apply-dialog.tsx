"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { applyForRoom } from "@/lib/api/application";
import { toFormFailure } from "@/lib/api/formFailure";
import { formatDate } from "@/lib/format";
import type { Application } from "@/types/application";
import type { RoomDetail } from "@/types/room";
import {
  buildApplyPayload,
  toUtcDateValue,
  validateApplyForm,
  type ApplyFormValues,
} from "@/validation/application";

const FIELDS = ["moveInDate", "leaseMonths", "message"] as const;
const MESSAGE_LIMIT = 500;

interface ApplyDialogProps {
  room: Pick<RoomDetail, "id" | "name" | "availableFrom" | "minLeaseMonths">;
  describedBy?: string;
  className?: string;
}

export function ApplyDialog({ room, describedBy, className }: ApplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Application | null>(null);
  const feedback = useActionFeedback();
  const queryClient = useQueryClient();

  const minDate = room.availableFrom ? toUtcDateValue(room.availableFrom) : null;
  const limits = { minDate, minLeaseMonths: room.minLeaseMonths };
  const monthsWord = room.minLeaseMonths === 1 ? "month" : "months";

  const defaultValues: ApplyFormValues = {
    moveInDate: minDate ?? "",
    leaseMonths: String(Math.max(room.minLeaseMonths, 1)),
    message: "",
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateApplyForm(value, limits);
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const built = buildApplyPayload(room.id, value);
      if (!built.ok) {
        feedback.handleFailure({ ok: false, message: built.message });
        return;
      }
      try {
        const response = await applyForRoom(built.payload);
        setCreated(response.data);
        toast.success(response.message);
        void queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      } catch (error) {
        // Guard messages (full room, duplicate, date, minimum term, missing room) show as the backend wrote them.
        feedback.handleFailure(toFormFailure(error), FIELDS);
      }
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset();
      feedback.reset();
      setCreated(null);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="lg"
        className={className}
        aria-describedby={describedBy}
        onClick={() => setOpen(true)}
      >
        Apply
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          {created ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                  Application sent
                </DialogTitle>
                <DialogDescription>
                  Your application for {room.name} is waiting for the owner. Applications expire after
                  14 days without a decision.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/applications/${created.id}`}>View application</Link>
                </Button>
              </DialogFooter>
            </div>
          ) : (
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
                <DialogTitle>Apply for {room.name}</DialogTitle>
                <DialogDescription>
                  The owner reviews your application and you are told the decision. You pay nothing
                  to apply.
                </DialogDescription>
              </DialogHeader>

              <FormError message={feedback.formError} />

              <form.Field name="moveInDate">
                {(field) => (
                  <FormField
                    id="apply-move-in"
                    label="Move-in date"
                    required
                    helper={
                      minDate && room.availableFrom
                        ? `This room is available from ${formatDate(room.availableFrom)}.`
                        : undefined
                    }
                    error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.moveInDate}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        name="moveInDate"
                        type="date"
                        min={minDate ?? undefined}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          feedback.clearField("moveInDate");
                          field.handleChange(event.target.value);
                        }}
                      />
                    )}
                  </FormField>
                )}
              </form.Field>

              <form.Field name="leaseMonths">
                {(field) => (
                  <FormField
                    id="apply-lease-months"
                    label="Lease length in months"
                    required
                    helper={`Minimum ${room.minLeaseMonths} ${monthsWord}, maximum 60.`}
                    error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.leaseMonths}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        name="leaseMonths"
                        type="number"
                        inputMode="numeric"
                        min={room.minLeaseMonths}
                        max={60}
                        step={1}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          feedback.clearField("leaseMonths");
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
                    id="apply-message"
                    label="Message to the owner (optional)"
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
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <SubmitButton
                      pending={isSubmitting}
                      cooldownSeconds={feedback.cooldownSeconds}
                      label="Send application"
                      pendingLabel="Sending"
                      className="sm:w-auto"
                    />
                  )}
                </form.Subscribe>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
