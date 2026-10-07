"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { ProfileFormStatus } from "@/components/shared/profile-form-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { toFormFailure } from "@/lib/api/formFailure";
import type { OwnerRoomDetail } from "@/types/owner-room";
import { ROOM_STATUSES, type RoomStatus } from "@/validation/enums";
import { toFieldErrors } from "@/validation/property";
import { SetRoomAvailabilityZodSchema, dateInputToIso, isoToDateInput } from "@/validation/room";
import { PublishSwitch } from "../../_components/publish-switch";
import { useSetAvailability } from "../../_hooks/use-room-queries";

interface AvailabilityValues {
  status: RoomStatus;
  availableFrom: string;
}

const FIELDS = ["status", "availableFrom"] as const;

function toValues(room: OwnerRoomDetail): AvailabilityValues {
  return { status: room.status, availableFrom: isoToDateInput(room.availableFrom) };
}

/** Only the changed keys. An emptied date is left out: the backend cannot clear it. */
function toPayload(value: AvailabilityValues, initial: AvailabilityValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (value.status !== initial.status) payload.status = value.status;
  if (value.availableFrom !== initial.availableFrom && value.availableFrom !== "") {
    payload.availableFrom = dateInputToIso(value.availableFrom);
  }
  return payload;
}

export function RoomAvailability({ room }: { room: OwnerRoomDetail }) {
  const feedback = useActionFeedback();
  const mutation = useSetAvailability(room.id);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [initial, setInitial] = useState(() => toValues(room));

  const form = useForm({
    defaultValues: initial,
    validators: {
      onSubmit: ({ value }) => {
        const result = SetRoomAvailabilityZodSchema.safeParse(toPayload(value, initial));
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSavedMessage(null);
      const body = SetRoomAvailabilityZodSchema.parse(toPayload(value, initial));
      if (Object.keys(body).length === 0) {
        setSavedMessage("No changes to save.");
        return;
      }
      try {
        const response = await mutation.mutateAsync(body);
        setInitial(value);
        form.reset(value);
        setSavedMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        // Guard messages such as the 409 "fully occupied" one are shown exactly as the backend sent them.
        feedback.handleFailure(toFormFailure(error), FIELDS);
      }
    },
  });

  const edited = () => setSavedMessage(null);
  const occupancy = room.bedCount > 0 ? (room.occupiedBeds / room.bedCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Publishing and occupancy</CardTitle>
          <CardDescription>
            A published room appears in the public search. Occupancy changes only through leases
            and payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <PublishSwitch roomId={room.id} roomName={room.name} isPublished={room.isPublished} />
          <div className="max-w-sm space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              {room.occupiedBeds} of {room.bedCount} beds occupied
            </p>
            <Progress
              value={occupancy}
              aria-label={`${room.occupiedBeds} of ${room.bedCount} beds occupied`}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Status and availability date</CardTitle>
          <CardDescription>
            A room that is fully occupied cannot be published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <ProfileFormStatus savedMessage={savedMessage} errorMessage={feedback.formError} />

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="status">
                {(field) => (
                  <FormField
                    id="room-status"
                    label="Status"
                    error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.status}
                  >
                    {(control) => (
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => {
                          feedback.clearField("status");
                          edited();
                          field.handleChange(value as RoomStatus);
                        }}
                      >
                        <SelectTrigger {...control} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0) + status.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormField>
                )}
              </form.Field>

              <form.Field name="availableFrom">
                {(field) => (
                  <FormField
                    id="room-available-from"
                    label="Available from"
                    helper="The date cannot be cleared once it is set."
                    error={
                      firstError(field.state.meta.errors) ?? feedback.fieldErrors.availableFrom
                    }
                  >
                    {(control) => (
                      <Input
                        {...control}
                        name="availableFrom"
                        type="date"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          feedback.clearField("availableFrom");
                          edited();
                          field.handleChange(event.target.value);
                        }}
                      />
                    )}
                  </FormField>
                )}
              </form.Field>
            </div>

            <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
              {([isSubmitting, isDefaultValue]) => (
                <div className="flex justify-end">
                  <SubmitButton
                    pending={isSubmitting}
                    disabled={isDefaultValue}
                    cooldownSeconds={feedback.cooldownSeconds}
                    label="Save changes"
                    pendingLabel="Saving"
                    className="sm:w-auto sm:min-w-44"
                  />
                </div>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
