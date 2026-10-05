"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { ProfileFormStatus } from "@/components/shared/profile-form-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { MANAGER_QUERY_KEY, useInvalidateProfile } from "@/hooks/useProfile";
import { toFormFailure } from "@/lib/api/formFailure";
import { updateManagerProfile } from "@/lib/api/profile";
import type { ManagerProfile } from "@/types/profile";
import {
  BIO_MAX,
  MANAGER_FIELDS,
  UpdateManagerProfileZodSchema,
  toFieldErrors,
  toManagerPayload,
  type ManagerValues,
} from "@/validation/profile";

function toValues(profile: ManagerProfile): ManagerValues {
  return { contactNumber: profile.contactNumber ?? "", bio: profile.bio ?? "" };
}

export function ManagerProfileForm({ profile }: { profile: ManagerProfile }) {
  const feedback = useActionFeedback();
  const invalidate = useInvalidateProfile();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: updateManagerProfile });

  const form = useForm({
    defaultValues: toValues(profile),
    validators: {
      onSubmit: ({ value }) => {
        const result = UpdateManagerProfileZodSchema.safeParse(toManagerPayload(value));
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSavedMessage(null);
      try {
        const response = await mutation.mutateAsync(
          UpdateManagerProfileZodSchema.parse(toManagerPayload(value)),
        );
        invalidate(MANAGER_QUERY_KEY);
        form.reset(toValues(response.data));
        setSavedMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        feedback.handleFailure(toFormFailure(error), MANAGER_FIELDS);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Contact details</CardTitle>
        <CardDescription>Owners can use these to reach you about their properties.</CardDescription>
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

          <form.Field name="contactNumber">
            {(field) => (
              <FormField
                id="manager-contact"
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
                      setSavedMessage(null);
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            )}
          </form.Field>

          <form.Field name="bio">
            {(field) => (
              <FormField
                id="manager-bio"
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
                      setSavedMessage(null);
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
            {([isSubmitting, isDefaultValue]) => (
              <div className="flex justify-end">
                <SubmitButton
                  pending={isSubmitting}
                  disabled={isDefaultValue}
                  cooldownSeconds={feedback.cooldownSeconds}
                  label="Save contact details"
                  pendingLabel="Saving"
                  className="sm:w-auto sm:min-w-44"
                />
              </div>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
