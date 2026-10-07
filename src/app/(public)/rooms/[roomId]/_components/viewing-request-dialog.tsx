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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { toFormFailure } from "@/lib/api/formFailure";
import { createViewing } from "@/lib/api/viewing";
import { TIME_SLOT_LABELS } from "@/lib/viewing-labels";
import type { RoomDetail } from "@/types/room";
import type { Viewing } from "@/types/viewing";
import { VIEWING_TIME_SLOTS } from "@/validation/enums";
import {
  VIEWING_MESSAGE_LIMIT,
  buildViewingPayload,
  todayDateValue,
  validateViewingForm,
  type ViewingFormValues,
} from "@/validation/viewing";

const FIELDS = ["preferredDate", "timeSlot", "message"] as const;
const TENANT_PROFILE_MISSING = "Tenant profile not found";

interface ViewingRequestDialogProps {
  room: Pick<RoomDetail, "id" | "name">;
  className?: string;
  /** Trigger button text; defaults to the full wording. */
  label?: string;
}

export function ViewingRequestDialog({
  room,
  className,
  label = "Request a viewing",
}: ViewingRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Viewing | null>(null);
  const feedback = useActionFeedback();
  const queryClient = useQueryClient();

  const defaultValues: ViewingFormValues = { preferredDate: "", timeSlot: "MORNING", message: "" };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateViewingForm(value, todayDateValue());
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const built = buildViewingPayload(room.id, value);
      if (!built.ok) {
        feedback.handleFailure({ ok: false, message: built.message });
        return;
      }
      try {
        const response = await createViewing(built.payload);
        setCreated(response.data);
        toast.success(response.message);
        void queryClient.invalidateQueries({ queryKey: ["viewings"] });
      } catch (error) {
        // Guard messages (duplicate request, unavailable room) show as the server wrote them.
        const failure = toFormFailure(error);
        feedback.handleFailure(
          failure.message === TENANT_PROFILE_MISSING
            ? { ...failure, message: "Complete your tenant profile before requesting a viewing." }
            : failure,
          FIELDS,
        );
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
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          {created ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                  Viewing request sent
                </DialogTitle>
                <DialogDescription>
                  The owner will look at your request for {room.name} and you will be told their
                  answer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href="/dashboard/viewings">View my requests</Link>
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
                <DialogTitle>Request a viewing of {room.name}</DialogTitle>
                <DialogDescription>
                  Pick the day and the time of day that suit you. The owner confirms a time.
                </DialogDescription>
              </DialogHeader>

              <FormError message={feedback.formError} />

              <form.Field name="preferredDate">
                {(field) => (
                  <FormField
                    id="viewing-date"
                    label="Preferred day"
                    required
                    error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.preferredDate}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        name="preferredDate"
                        type="date"
                        min={todayDateValue()}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          feedback.clearField("preferredDate");
                          field.handleChange(event.target.value);
                        }}
                      />
                    )}
                  </FormField>
                )}
              </form.Field>

              <form.Field name="timeSlot">
                {(field) => (
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Time of day</legend>
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(value) => {
                        feedback.clearField("timeSlot");
                        field.handleChange(value as ViewingFormValues["timeSlot"]);
                      }}
                      className="grid-cols-3"
                      aria-label="Time of day"
                    >
                      {VIEWING_TIME_SLOTS.map((slot) => (
                        <Label
                          key={slot}
                          htmlFor={`viewing-slot-${slot}`}
                          className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3"
                        >
                          <RadioGroupItem id={`viewing-slot-${slot}`} value={slot} />
                          {TIME_SLOT_LABELS[slot]}
                        </Label>
                      ))}
                    </RadioGroup>
                    {feedback.fieldErrors.timeSlot ? (
                      <p role="alert" className="text-xs text-error-text">
                        {feedback.fieldErrors.timeSlot}
                      </p>
                    ) : null}
                  </fieldset>
                )}
              </form.Field>

              <form.Field name="message">
                {(field) => (
                  <FormField
                    id="viewing-message"
                    label="Message to the owner (optional)"
                    helper={`${field.state.value.length} of ${VIEWING_MESSAGE_LIMIT} characters`}
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
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
