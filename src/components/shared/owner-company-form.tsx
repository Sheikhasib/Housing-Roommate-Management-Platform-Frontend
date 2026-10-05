"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { ProfileFormStatus } from "@/components/shared/profile-form-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { OWNER_QUERY_KEY, useInvalidateProfile } from "@/hooks/useProfile";
import { toFormFailure } from "@/lib/api/formFailure";
import { updateOwnerProfile } from "@/lib/api/profile";
import type { OwnerProfile } from "@/types/profile";
import {
  OWNER_FIELDS,
  UpdateOwnerProfileZodSchema,
  toFieldErrors,
  toOwnerPayload,
  type OwnerValues,
} from "@/validation/profile";

function toValues(profile: OwnerProfile): OwnerValues {
  return {
    contactNumber: profile.contactNumber ?? "",
    companyName: profile.companyName ?? "",
    address: profile.address ?? "",
  };
}

const FIELD_META = [
  { name: "companyName", id: "owner-company", label: "Company name", autoComplete: "organization" },
  { name: "contactNumber", id: "owner-contact", label: "Contact number", autoComplete: "tel" },
  { name: "address", id: "owner-address", label: "Address", autoComplete: "street-address" },
] as const;

export function OwnerCompanyForm({ profile }: { profile: OwnerProfile }) {
  const feedback = useActionFeedback();
  const invalidate = useInvalidateProfile();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: updateOwnerProfile });

  const form = useForm({
    defaultValues: toValues(profile),
    validators: {
      onSubmit: ({ value }) => {
        const result = UpdateOwnerProfileZodSchema.safeParse(toOwnerPayload(value));
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSavedMessage(null);
      try {
        const response = await mutation.mutateAsync(
          UpdateOwnerProfileZodSchema.parse(toOwnerPayload(value)),
        );
        invalidate(OWNER_QUERY_KEY);
        form.reset(toValues(response.data));
        setSavedMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        feedback.handleFailure(toFormFailure(error), OWNER_FIELDS);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Company details</CardTitle>
        <CardDescription>Shown to tenants on your properties. Saving does not affect your verification.</CardDescription>
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

          {FIELD_META.map((meta) => (
            <form.Field key={meta.name} name={meta.name}>
              {(field) => (
                <FormField
                  id={meta.id}
                  label={meta.label}
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors[meta.name]}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name={meta.name}
                      autoComplete={meta.autoComplete}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField(meta.name);
                        setSavedMessage(null);
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>
          ))}

          <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
            {([isSubmitting, isDefaultValue]) => (
              <div className="flex justify-end">
                <SubmitButton
                  pending={isSubmitting}
                  disabled={isDefaultValue}
                  cooldownSeconds={feedback.cooldownSeconds}
                  label="Save company details"
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
