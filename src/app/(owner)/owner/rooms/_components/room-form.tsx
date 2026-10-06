"use client";

import { useState, type ReactNode } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";

import {
  FormField,
  SubmitButton,
  firstError,
} from "@/components/shared/form-field";
import { ProfileFormStatus } from "@/components/shared/profile-form-status";
import { TagInput } from "@/components/shared/tag-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { toFormFailure } from "@/lib/api/formFailure";
import { getPropertyDetail } from "@/lib/api/ownerProperty";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import { ROOM_TYPES } from "@/validation/enums";
import { toFieldErrors } from "@/validation/property";
import {
  CreateRoomZodSchema,
  ROOM_CREATE_FIELDS,
  UpdateRoomZodSchema,
  toCreateRoomPayload,
  toUpdateRoomPayload,
  type RoomCreateValues,
} from "@/validation/room";
import { propertyKey } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { usePropertyPicker } from "../_hooks/use-room-queries";

const NO_UNIT = "__none__";

type TextName =
  | "name"
  | "monthlyRent"
  | "bookingDeposit"
  | "bedCount"
  | "sizeSqft"
  | "minLeaseMonths"
  | "availableFrom";

interface RoomFormProps {
  mode: "create" | "edit";
  initial: RoomCreateValues;
  /** Sends the values and returns the backend success message. Throw the ApiError on failure. */
  onSubmit: (value: RoomCreateValues, initial: RoomCreateValues) => Promise<string>;
  submitLabel: string;
  pendingLabel: string;
  /** Extra content above the submit button, such as a hint. */
  footer?: ReactNode;
}

/** The room form used by Create (all fields) and the Details tab (the editable ones). */
export function RoomForm({ mode, initial: initialValues, onSubmit, submitLabel, pendingLabel, footer }: RoomFormProps) {
  const creating = mode === "create";
  const feedback = useActionFeedback();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  // The last saved values: edits are sent as a diff against them.
  const [initial, setInitial] = useState(initialValues);

  const form = useForm({
    defaultValues: initial,
    validators: {
      onSubmit: ({ value }) => {
        const result = creating
          ? CreateRoomZodSchema.safeParse(toCreateRoomPayload(value))
          : UpdateRoomZodSchema.safeParse(toUpdateRoomPayload(value, initial));
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSavedMessage(null);
      try {
        const message = await onSubmit(value, initial);
        setSavedMessage(message);
        if (!creating) {
          setInitial(value);
          form.reset(value);
        }
      } catch (error) {
        feedback.handleFailure(toFormFailure(error), ROOM_CREATE_FIELDS);
      }
    },
  });

  const properties = usePropertyPicker(false, creating);
  const propertyId = useStore(form.store, (state) => state.values.propertyId);
  const units = useQuery({
    queryKey: propertyKey(propertyId),
    queryFn: () => getPropertyDetail(propertyId),
    enabled: creating && propertyId !== "",
    staleTime: 30 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const edited = () => setSavedMessage(null);

  const textField = (
    name: TextName,
    id: string,
    label: string,
    options: { type?: "number" | "date"; helper?: string; required?: boolean } = {},
  ) => (
    <form.Field name={name}>
      {(field) => (
        <FormField
          id={id}
          label={label}
          helper={options.helper}
          required={options.required}
          error={firstError(field.state.meta.errors) ?? feedback.fieldErrors[name]}
        >
          {(control) => (
            <Input
              {...control}
              name={name}
              type={options.type ?? "text"}
              step={options.type === "number" ? "any" : undefined}
              inputMode={options.type === "number" ? "decimal" : undefined}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => {
                feedback.clearField(name);
                edited();
                field.handleChange(event.target.value);
              }}
            />
          )}
        </FormField>
      )}
    </form.Field>
  );

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
      <ProfileFormStatus savedMessage={savedMessage} errorMessage={feedback.formError} />

      <div className="grid gap-4 sm:grid-cols-2">
        {creating ? (
          <>
            <form.Field name="propertyId">
              {(field) => (
                <FormField
                  id="room-property"
                  label="Property"
                  required
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.propertyId}
                  helper={
                    properties.data && properties.data.rows.length === 0
                      ? "You have no properties yet. Create a property first."
                      : undefined
                  }
                >
                  {(control) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        feedback.clearField("propertyId");
                        edited();
                        field.handleChange(value);
                        form.setFieldValue("unitId", "");
                      }}
                    >
                      <SelectTrigger {...control} className="w-full">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {(properties.data?.rows ?? []).map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="unitId">
              {(field) => (
                <FormField
                  id="room-unit"
                  label="Unit"
                  helper={
                    propertyId === ""
                      ? "Choose a property first. A unit is optional."
                      : "Optional. Leave empty if the room is not inside a unit."
                  }
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.unitId}
                >
                  {(control) => (
                    <Select
                      value={field.state.value || NO_UNIT}
                      disabled={propertyId === "" || units.isPending}
                      onValueChange={(value) => {
                        feedback.clearField("unitId");
                        edited();
                        field.handleChange(value === NO_UNIT ? "" : value);
                      }}
                    >
                      <SelectTrigger {...control} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_UNIT}>No unit</SelectItem>
                        {(units.data?.units ?? []).map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
              )}
            </form.Field>
          </>
        ) : null}

        {textField("name", "room-name", "Room name", { required: true })}

        <form.Field name="type">
          {(field) => (
            <FormField
              id="room-type"
              label="Room type"
              error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.type}
            >
              {(control) => (
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    feedback.clearField("type");
                    edited();
                    field.handleChange(value as RoomCreateValues["type"]);
                  }}
                >
                  <SelectTrigger {...control} className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ROOM_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )}
        </form.Field>

        {textField("monthlyRent", "room-rent", "Monthly rent (BDT)", {
          type: "number",
          required: true,
        })}
        {textField("bookingDeposit", "room-deposit", "Booking deposit (BDT)", {
          type: "number",
          helper: creating ? "Defaults to the monthly rent if you leave it empty." : undefined,
        })}
        {textField("bedCount", "room-beds", "Number of beds", {
          type: "number",
          helper: creating ? "1 to 8. Defaults to 1." : undefined,
        })}
        {textField("sizeSqft", "room-size", "Size (sq ft)", { type: "number" })}
        {textField("minLeaseMonths", "room-lease", "Minimum lease (months)", {
          type: "number",
          helper: creating ? "1 to 60. Defaults to 1." : undefined,
        })}
        {creating
          ? textField("availableFrom", "room-available-from", "Available from", {
              type: "date",
              helper: "Optional.",
            })
          : null}
      </div>

      <form.Field name="isFurnished">
        {(field) => (
          <div className="flex items-center gap-3">
            <Switch
              id="room-furnished"
              checked={field.state.value}
              onCheckedChange={(checked) => {
                edited();
                field.handleChange(checked);
              }}
            />
            <Label htmlFor="room-furnished">Furnished</Label>
          </div>
        )}
      </form.Field>

      <form.Field name="amenities">
        {(field) => (
          <FormField
            id="room-amenities"
            label="Amenities"
            helper="Type an amenity and press Enter, for example WiFi or Air conditioning."
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.amenities}
          >
            {(control) => (
              <TagInput
                {...control}
                value={field.state.value ?? []}
                onChange={(tags) => {
                  feedback.clearField("amenities");
                  edited();
                  field.handleChange(tags);
                }}
                placeholder="Add an amenity"
              />
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <FormField
            id="room-description"
            label="Description"
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.description}
          >
            {(control) => (
              <Textarea
                {...control}
                name="description"
                rows={4}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("description");
                  edited();
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      {footer}

      <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
        {([isSubmitting, isDefaultValue]) => (
          <div className="flex justify-end">
            <SubmitButton
              pending={isSubmitting}
              disabled={!creating && isDefaultValue}
              cooldownSeconds={feedback.cooldownSeconds}
              label={submitLabel}
              pendingLabel={pendingLabel}
              className="sm:w-auto sm:min-w-44"
            />
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
