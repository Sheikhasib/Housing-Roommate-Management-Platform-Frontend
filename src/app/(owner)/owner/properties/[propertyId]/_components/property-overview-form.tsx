"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { ProfileFormStatus } from "@/components/shared/profile-form-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { updateProperty } from "@/lib/api/ownerProperty";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import type { PropertyDetail } from "@/types/property";
import { PROPERTY_TYPES } from "@/validation/enums";
import {
  PROPERTY_FIELDS,
  UpdatePropertyZodSchema,
  toFieldErrors,
  toPropertyPayload,
  type PropertyValues,
} from "@/validation/property";
import { useRefreshProperty } from "../../_hooks/use-property-queries";

function toValues(property: PropertyDetail): PropertyValues {
  return {
    title: property.title,
    description: property.description ?? "",
    type: property.type,
    city: property.city,
    area: property.area ?? "",
    address: property.address ?? "",
    googleMapUrl: property.googleMapUrl ?? "",
    latitude: property.latitude === null ? "" : String(property.latitude),
    longitude: property.longitude === null ? "" : String(property.longitude),
    amenities: (property.amenities ?? []).join(", "),
    houseRules: property.houseRules ?? "",
  };
}

type TextName = "title" | "city" | "area" | "address" | "googleMapUrl" | "latitude" | "longitude";

const TEXT_FIELDS: readonly {
  name: TextName;
  id: string;
  label: string;
  helper?: string;
  inputMode?: "decimal";
}[] = [
  { name: "title", id: "property-title", label: "Title" },
  { name: "city", id: "property-city", label: "City" },
  { name: "area", id: "property-area", label: "Area" },
  { name: "address", id: "property-address", label: "Address" },
  { name: "googleMapUrl", id: "property-map-url", label: "Google Maps link" },
  {
    name: "latitude",
    id: "property-latitude",
    label: "Latitude",
    helper: "Between -90 and 90. Leave empty to clear the map pin.",
    inputMode: "decimal",
  },
  {
    name: "longitude",
    id: "property-longitude",
    label: "Longitude",
    helper: "Between -180 and 180. Leave empty to clear the map pin.",
    inputMode: "decimal",
  },
];

function mapsHref(values: PropertyValues): string | null {
  const url = values.googleMapUrl.trim();
  if (url) return url;
  const lat = values.latitude.trim();
  const lng = values.longitude.trim();
  return lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
    : null;
}

export function PropertyOverviewForm({ property }: { property: PropertyDetail }) {
  const feedback = useActionFeedback();
  const refresh = useRefreshProperty(property.id);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  // The last saved values: edits are sent as a diff against them.
  const [initial, setInitial] = useState(() => toValues(property));
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => updateProperty(property.id, body),
  });

  const form = useForm({
    defaultValues: initial,
    validators: {
      onSubmit: ({ value }) => {
        const result = UpdatePropertyZodSchema.safeParse(toPropertyPayload(value, initial));
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSavedMessage(null);
      try {
        const response = await mutation.mutateAsync(
          UpdatePropertyZodSchema.parse(toPropertyPayload(value, initial)),
        );
        setInitial(value);
        form.reset(value);
        refresh();
        setSavedMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        feedback.handleFailure(toFormFailure(error), PROPERTY_FIELDS);
      }
    },
  });

  const edited = () => setSavedMessage(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Property details</CardTitle>
        <CardDescription>
          Changes are saved to the listing right away. Only the fields you change are sent.
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
            {TEXT_FIELDS.slice(0, 2).map((meta) => (
              <form.Field key={meta.name} name={meta.name}>
                {(field) => (
                  <FormField
                    id={meta.id}
                    label={meta.label}
                    required
                    error={firstError(field.state.meta.errors) ?? feedback.fieldErrors[meta.name]}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        name={meta.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          feedback.clearField(meta.name);
                          edited();
                          field.handleChange(event.target.value);
                        }}
                      />
                    )}
                  </FormField>
                )}
              </form.Field>
            ))}

            <form.Field name="type">
              {(field) => (
                <FormField
                  id="property-type"
                  label="Property type"
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.type}
                >
                  {(control) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        feedback.clearField("type");
                        edited();
                        field.handleChange(value as PropertyValues["type"]);
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

            {TEXT_FIELDS.slice(2).map((meta) => (
              <form.Field key={meta.name} name={meta.name}>
                {(field) => (
                  <FormField
                    id={meta.id}
                    label={meta.label}
                    helper={meta.helper}
                    error={firstError(field.state.meta.errors) ?? feedback.fieldErrors[meta.name]}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        name={meta.name}
                        inputMode={meta.inputMode}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          feedback.clearField(meta.name);
                          edited();
                          field.handleChange(event.target.value);
                        }}
                      />
                    )}
                  </FormField>
                )}
              </form.Field>
            ))}
          </div>

          <form.Field name="amenities">
            {(field) => (
              <FormField
                id="property-amenities"
                label="Amenities"
                helper="Separate amenities with commas, for example WiFi, Lift, Parking."
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.amenities}
              >
                {(control) => (
                  <Input
                    {...control}
                    name="amenities"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("amenities");
                      edited();
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
                id="property-description"
                label="Description"
                helper="Up to 2000 characters."
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

          <form.Field name="houseRules">
            {(field) => (
              <FormField
                id="property-rules"
                label="House rules"
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.houseRules}
              >
                {(control) => (
                  <Textarea
                    {...control}
                    name="houseRules"
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("houseRules");
                      edited();
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.isSubmitting, state.isDefaultValue, state.values] as const}
          >
            {([isSubmitting, isDefaultValue, values]) => {
              const href = mapsHref(values);
              return (
                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      Open in Google Maps
                    </a>
                  ) : (
                    <span />
                  )}
                  <SubmitButton
                    pending={isSubmitting}
                    disabled={isDefaultValue}
                    cooldownSeconds={feedback.cooldownSeconds}
                    label="Save changes"
                    pendingLabel="Saving"
                    className="sm:w-auto sm:min-w-44"
                  />
                </div>
              );
            }}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
