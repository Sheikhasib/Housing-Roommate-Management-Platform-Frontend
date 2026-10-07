"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { FormError, FormField, firstError } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { toFormFailure } from "@/lib/api/formFailure";
import { CreateUtilityBillZodSchema } from "@/validation/invoice";
import { useCreateUtilityBill } from "../_hooks/use-owner-invoice-queries";

const FIELDS = ["roomId", "amount", "periodStart", "periodEnd", "dueDate", "description"] as const;
type Field = (typeof FIELDS)[number];

interface FormValues {
  roomId: string;
  amount: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  description: string;
}

const EMPTY: FormValues = {
  roomId: "",
  amount: "",
  periodStart: "",
  periodEnd: "",
  dueDate: "",
  description: "",
};

const END_BEFORE_START = "The end date must be on or after the start date.";
const DUPLICATE_BILL = "A bill for this room and period already exists.";
/** The backend's own text for a second bill in the same period; it is replaced for the user. */
const DUPLICATE_KEY_TEXT = "Duplicate Key Error";

/** "2026-10-15" to an ISO datetime with the local offset, at the start or the end of that day. */
function toOffsetIso(date: string, endOfDay: boolean): string {
  const time = endOfDay ? "23:59:59" : "00:00:00";
  const instant = new Date(`${date}T${time}`);
  if (Number.isNaN(instant.getTime())) return "";
  const offset = -instant.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  return `${date}T${time}${sign}${hours}:${minutes}`;
}

/** Builds the body for the exact backend schema from the form values. */
function toBody(value: FormValues) {
  const amount = value.amount.trim();
  return {
    roomId: value.roomId,
    amount: amount ? Number(amount) : undefined,
    periodStart: value.periodStart ? toOffsetIso(value.periodStart, false) : undefined,
    periodEnd: value.periodEnd ? toOffsetIso(value.periodEnd, true) : undefined,
    dueDate: value.dueDate ? toOffsetIso(value.dueDate, true) : undefined,
    description: value.description.trim() || undefined,
  };
}

/** The exact backend schema, plus plain messages for empty fields and the date order check. */
function validate(value: FormValues): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!value.roomId) errors.roomId = "Choose a room";
  if (!value.periodStart) errors.periodStart = "Choose the start date";
  if (!value.periodEnd) errors.periodEnd = "Choose the end date";
  if (!value.dueDate) errors.dueDate = "Choose the due date";

  const result = CreateUtilityBillZodSchema.safeParse(toBody(value));
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && (FIELDS as readonly string[]).includes(key)) {
        errors[key as Field] ??= issue.message;
      }
    }
  }
  if (value.periodStart && value.periodEnd && value.periodEnd < value.periodStart) {
    errors.periodEnd ??= END_BEFORE_START;
  }
  return errors;
}

interface CreateUtilityBillProps {
  rooms: readonly { value: string; label: string }[];
  /** The room chosen in the page filter, preselected in the form. */
  selectedRoomId: string;
}

/** "Create utility bill" button and dialog. Only roles with `invoices.manage` render it. */
export function CreateUtilityBill({ rooms, selectedRoomId }: CreateUtilityBillProps) {
  const mutation = useCreateUtilityBill();
  const feedback = useActionFeedback();
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: { ...EMPTY, roomId: selectedRoomId },
    validators: {
      onSubmit: ({ value }) => {
        const errors = validate(value);
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const parsed = CreateUtilityBillZodSchema.safeParse(toBody(value));
      if (!parsed.success) return;
      try {
        const response = await mutation.mutateAsync(parsed.data);
        toast.success(response.message);
        setOpen(false);
        form.reset();
      } catch (error) {
        const failure = toFormFailure(error);
        const fieldErrors: Record<string, string> = {};
        for (const [name, message] of Object.entries(failure.fieldErrors ?? {})) {
          fieldErrors[name.split(".").pop() ?? name] = message;
        }
        // Other messages (no active lease, not assigned to the room) are shown as the server sent them.
        const message =
          failure.status === 409 && failure.message === DUPLICATE_KEY_TEXT
            ? DUPLICATE_BILL
            : failure.message;
        feedback.handleFailure({ ...failure, message, fieldErrors }, FIELDS);
      }
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return;
    setOpen(next);
    feedback.reset();
    if (next) form.reset({ ...EMPTY, roomId: selectedRoomId });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus aria-hidden="true" />
          Create utility bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
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
            <DialogTitle>Create utility bill</DialogTitle>
            <DialogDescription>
              The amount is split equally among the tenants who have an active lease in the room. If
              it does not divide evenly, the last tenant pays the extra cents (for example 33.33,
              33.33 and 33.34).
            </DialogDescription>
          </DialogHeader>

          <FormError message={feedback.formError} />

          <form.Field name="roomId">
            {(field) => (
              <FormField
                id="bill-room"
                label="Room"
                required
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.roomId}
              >
                {(control) => (
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      feedback.clearField("roomId");
                      field.handleChange(value);
                    }}
                  >
                    <SelectTrigger {...control} className="w-full">
                      <SelectValue placeholder="Pick a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.value} value={room.value}>
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            )}
          </form.Field>

          <form.Field name="amount">
            {(field) => (
              <FormField
                id="bill-amount"
                label="Total amount (BDT)"
                required
                helper="The whole bill, before it is split"
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.amount}
              >
                {(control) => (
                  <Input
                    {...control}
                    name="amount"
                    inputMode="decimal"
                    autoComplete="off"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("amount");
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            )}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="periodStart">
              {(field) => (
                <FormField
                  id="bill-period-start"
                  label="Period start"
                  required
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.periodStart}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="periodStart"
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("periodStart");
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="periodEnd">
              {(field) => (
                <FormField
                  id="bill-period-end"
                  label="Period end"
                  required
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.periodEnd}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="periodEnd"
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("periodEnd");
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>
          </div>

          <form.Field name="dueDate">
            {(field) => (
              <FormField
                id="bill-due-date"
                label="Due date"
                required
                helper="Tenants can pay until the end of this day"
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.dueDate}
              >
                {(control) => (
                  <Input
                    {...control}
                    name="dueDate"
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("dueDate");
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <FormField
                id="bill-description"
                label="Description"
                helper="Optional. Tenants see this on their invoice"
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.description}
              >
                {(control) => (
                  <Textarea
                    {...control}
                    name="description"
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("description");
                      field.handleChange(event.target.value);
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
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || feedback.coolingDown}>
              {mutation.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {mutation.isPending
                ? "Creating bill"
                : feedback.coolingDown
                  ? `Try again in ${feedback.cooldownSeconds}s`
                  : "Create bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
