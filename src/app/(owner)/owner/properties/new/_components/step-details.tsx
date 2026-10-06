"use client";

import { useForm } from "@tanstack/react-form";

import { FormField, firstError } from "@/components/shared/form-field";
import { TagInput } from "@/components/shared/tag-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import { usePropertyWizardStore } from "@/store/property-wizard-store";
import { PROPERTY_TYPES } from "@/validation/enums";
import {
  CreatePropertyZodSchema,
  toCreatePropertyPayload,
  toFieldErrors,
  type WizardDetails,
} from "@/validation/property";

export const DETAILS_FORM_ID = "wizard-details-form";

type TextName = "title" | "city" | "area" | "address" | "googleMapUrl" | "latitude" | "longitude";

const TEXT_FIELDS: readonly {
  name: TextName;
  label: string;
  required?: boolean;
  helper?: string;
  inputMode?: "decimal";
}[] = [
  { name: "title", label: "Title", required: true, helper: "3 to 100 characters." },
  { name: "city", label: "City", required: true },
  { name: "area", label: "Area" },
  { name: "address", label: "Address" },
  { name: "googleMapUrl", label: "Google Maps link", helper: "A full link, for example https://maps.google.com/..." },
  { name: "latitude", label: "Latitude", helper: "Optional. Between -90 and 90.", inputMode: "decimal" },
  { name: "longitude", label: "Longitude", helper: "Optional. Between -180 and 180.", inputMode: "decimal" },
];

/** Step 1. Validates with the create schema when Next is pressed and saves every edit to the draft. */
export function StepDetails({ onValid }: { onValid: () => void }) {
  const setDetails = usePropertyWizardStore((state) => state.setDetails);

  const form = useForm({
    defaultValues: usePropertyWizardStore.getState().details,
    validators: {
      onSubmit: ({ value }) => {
        const result = CreatePropertyZodSchema.safeParse(toCreatePropertyPayload(value));
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: () => onValid(),
  });

  const textInput = (meta: (typeof TEXT_FIELDS)[number]) => (
    <form.Field key={meta.name} name={meta.name}>
      {(field) => (
        <FormField
          id={`wizard-${meta.name}`}
          label={meta.label}
          required={meta.required}
          helper={meta.helper}
          error={firstError(field.state.meta.errors)}
        >
          {(control) => (
            <Input
              {...control}
              name={meta.name}
              inputMode={meta.inputMode}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => {
                field.handleChange(event.target.value);
                setDetails({ [meta.name]: event.target.value } as Pick<WizardDetails, TextName>);
              }}
            />
          )}
        </FormField>
      )}
    </form.Field>
  );

  return (
    <form
      id={DETAILS_FORM_ID}
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.slice(0, 2).map(textInput)}

        <form.Field name="type">
          {(field) => (
            <FormField
              id="wizard-type"
              label="Property type"
              error={firstError(field.state.meta.errors)}
            >
              {(control) => (
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as WizardDetails["type"]);
                    setDetails({ type: value as WizardDetails["type"] });
                  }}
                >
                  <SelectTrigger {...control} className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {PROPERTY_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )}
        </form.Field>

        {TEXT_FIELDS.slice(2).map(textInput)}
      </div>

      <form.Field name="amenities">
        {(field) => (
          <FormField
            id="wizard-amenities"
            label="Amenities"
            helper="Type an amenity and press Enter, for example WiFi or Lift."
            error={firstError(field.state.meta.errors)}
          >
            {(control) => (
              <TagInput
                {...control}
                value={field.state.value}
                placeholder="Add an amenity"
                onChange={(tags) => {
                  field.handleChange(tags);
                  setDetails({ amenities: tags });
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <FormField
            id="wizard-description"
            label="Description"
            helper="Up to 2000 characters."
            error={firstError(field.state.meta.errors)}
          >
            {(control) => (
              <Textarea
                {...control}
                name="description"
                rows={4}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  setDetails({ description: event.target.value });
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="houseRules">
        {(field) => (
          <FormField
            id="wizard-rules"
            label="House rules"
            error={firstError(field.state.meta.errors)}
          >
            {(control) => (
              <Textarea
                {...control}
                name="houseRules"
                rows={3}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  setDetails({ houseRules: event.target.value });
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>
    </form>
  );
}
