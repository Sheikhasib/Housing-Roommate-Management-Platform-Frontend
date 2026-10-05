"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { ProfileFormStatus } from "@/components/shared/profile-form-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TENANT_QUERY_KEY, useInvalidateProfile } from "@/hooks/useProfile";
import { toFormFailure } from "@/lib/api/formFailure";
import { updateTenantProfile } from "@/lib/api/profile";
import type { TenantProfile } from "@/types/profile";
import { GENDERS } from "@/validation/enums";
import {
  BIO_MAX,
  TENANT_FIELDS,
  UpdateTenantProfileZodSchema,
  isoToDateInput,
  toFieldErrors,
  toTenantPayload,
  type TenantValues,
} from "@/validation/profile";

const GENDER_LABELS = { MALE: "Male", FEMALE: "Female", OTHER: "Other" } as const;

const LIFESTYLE = [
  { name: "smoker", label: "I smoke", hint: "Helps match you with people who are fine with smoking." },
  { name: "petFriendly", label: "Pet friendly", hint: "I am happy to live with pets." },
  { name: "hasPets", label: "I have pets", hint: "Owners and roommates see this before they decide." },
  {
    name: "lookingForRoommate",
    label: "Looking for a roommate",
    hint: "Turn this on to unlock roommate matching.",
  },
] as const;

function toValues(profile: TenantProfile): TenantValues {
  return {
    contactNumber: profile.contactNumber ?? "",
    gender: profile.gender ?? "",
    dateOfBirth: isoToDateInput(profile.dateOfBirth),
    occupation: profile.occupation ?? "",
    bio: profile.bio ?? "",
    preferredCity: profile.preferredCity ?? "",
    monthlyBudgetMax: profile.monthlyBudgetMax === null ? "" : String(profile.monthlyBudgetMax),
    moveInDate: isoToDateInput(profile.moveInDate),
    smoker: profile.smoker,
    petFriendly: profile.petFriendly,
    hasPets: profile.hasPets,
    lookingForRoommate: profile.lookingForRoommate,
  };
}

export function TenantPreferencesForm({ profile }: { profile: TenantProfile }) {
  const feedback = useActionFeedback();
  const invalidate = useInvalidateProfile();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: updateTenantProfile });

  const form = useForm({
    defaultValues: toValues(profile),
    validators: {
      onSubmit: ({ value }) => {
        const result = UpdateTenantProfileZodSchema.safeParse(toTenantPayload(value));
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSavedMessage(null);
      try {
        const response = await mutation.mutateAsync(
          UpdateTenantProfileZodSchema.parse(toTenantPayload(value)),
        );
        invalidate(TENANT_QUERY_KEY);
        form.reset(toValues(response.data));
        setSavedMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        feedback.handleFailure(toFormFailure(error), TENANT_FIELDS);
      }
    },
  });

  const edited = () => setSavedMessage(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Preferences</CardTitle>
        <CardDescription>Used for roommate matching and to speed up your applications.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <ProfileFormStatus savedMessage={savedMessage} errorMessage={feedback.formError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="contactNumber">
              {(field) => (
                <FormField
                  id="tenant-contact"
                  label="Contact number"
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.contactNumber}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="contactNumber"
                      type="tel"
                      autoComplete="tel"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("contactNumber");
                        edited();
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="gender">
              {(field) => (
                <FormField
                  id="tenant-gender"
                  label="Gender"
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.gender}
                >
                  {(control) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        feedback.clearField("gender");
                        edited();
                        field.handleChange(value as TenantValues["gender"]);
                      }}
                    >
                      <SelectTrigger {...control} className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {GENDER_LABELS[gender]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="dateOfBirth">
              {(field) => (
                <FormField
                  id="tenant-dob"
                  label="Date of birth"
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.dateOfBirth}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="dateOfBirth"
                      type="date"
                      autoComplete="bday"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("dateOfBirth");
                        edited();
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="occupation">
              {(field) => (
                <FormField
                  id="tenant-occupation"
                  label="Occupation"
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.occupation}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="occupation"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("occupation");
                        edited();
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="preferredCity">
              {(field) => (
                <FormField
                  id="tenant-city"
                  label="Preferred city"
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.preferredCity}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="preferredCity"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("preferredCity");
                        edited();
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="monthlyBudgetMax">
              {(field) => (
                <FormField
                  id="tenant-budget"
                  label="Maximum monthly budget"
                  helper="In taka, whole numbers only"
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.monthlyBudgetMax}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="monthlyBudgetMax"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("monthlyBudgetMax");
                        edited();
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="moveInDate">
              {(field) => (
                <FormField
                  id="tenant-move-in"
                  label="Move-in date"
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.moveInDate}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="moveInDate"
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("moveInDate");
                        edited();
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>
          </div>

          <form.Field name="bio">
            {(field) => (
              <FormField
                id="tenant-bio"
                label="About you"
                helper={`${field.state.value.length} / ${BIO_MAX} characters`}
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.bio}
              >
                {(control) => (
                  <Textarea
                    {...control}
                    name="bio"
                    rows={4}
                    className="min-h-24"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("bio");
                      edited();
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            )}
          </form.Field>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Lifestyle</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {LIFESTYLE.map((item) => (
                <form.Field key={item.name} name={item.name}>
                  {(field) => (
                    <div className="flex min-h-10 items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
                      <div className="min-w-0 space-y-0.5">
                        <Label htmlFor={`tenant-${item.name}`}>{item.label}</Label>
                        <p id={`tenant-${item.name}-hint`} className="text-xs text-muted-foreground">
                          {item.hint}
                        </p>
                      </div>
                      <Switch
                        id={`tenant-${item.name}`}
                        aria-describedby={`tenant-${item.name}-hint`}
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          edited();
                          field.handleChange(checked);
                        }}
                      />
                    </div>
                  )}
                </form.Field>
              ))}
            </div>
          </fieldset>

          <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
            {([isSubmitting, isDefaultValue]) => (
              <div className="flex justify-end">
                <SubmitButton
                  pending={isSubmitting}
                  disabled={isDefaultValue}
                  cooldownSeconds={feedback.cooldownSeconds}
                  label="Save preferences"
                  pendingLabel="Saving"
                  className="sm:w-auto sm:min-w-40"
                />
              </div>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
