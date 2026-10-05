"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { FileUploader } from "@/components/shared/file-uploader";
import { FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { ProfileFormStatus } from "@/components/shared/profile-form-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { useInvalidateProfile } from "@/hooks/useProfile";
import { toFormFailure } from "@/lib/api/formFailure";
import { updateAccountName } from "@/lib/api/profile";
import type { UserSummary } from "@/types/profile";
import { toAccountPayload, toFieldErrors, updateProfileZodSchema } from "@/validation/profile";

const NAME_TOO_SHORT = "Name must be at least 3 characters long";

interface AccountSectionProps {
  user: { name: string; email: string };
}

/** Avatar upload, name form, the read-only email and the password link. Shared by every role. */
export function AccountSection({ user }: AccountSectionProps) {
  const feedback = useActionFeedback();
  const invalidate = useInvalidateProfile();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (name: string) => updateAccountName({ name }),
  });

  const form = useForm({
    defaultValues: { name: user.name },
    validators: {
      onSubmit: ({ value }) => {
        const payload = toAccountPayload(value);
        if (!payload.name) return { fields: { name: NAME_TOO_SHORT } };
        const result = updateProfileZodSchema.safeParse(payload);
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSavedMessage(null);
      const name = toAccountPayload(value).name ?? "";
      try {
        const response = await mutation.mutateAsync(name);
        invalidate();
        form.reset({ name: response.data.name });
        setSavedMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        feedback.handleFailure(toFormFailure(error), ["name"]);
      }
    },
  });

  const handleUploaded = (message: string) => {
    invalidate();
    toast.success(message);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profile picture</CardTitle>
          <CardDescription>This picture shows in the top bar and across the site.</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader<UserSummary>
            kind="image"
            fieldName="profileImage"
            url="/user/profile-image"
            method="PATCH"
            label="Choose a new profile picture"
            onUploaded={(response) => handleUploaded(response.message)}
            onError={(error) => toast.error(error.errors[0]?.message || error.message)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Account details</CardTitle>
          <CardDescription>Your name is shown to owners, managers and tenants.</CardDescription>
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

            <form.Field name="name">
              {(field) => (
                <FormField
                  id="account-name"
                  label="Name"
                  required
                  error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.name}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="name"
                      autoComplete="name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        feedback.clearField("name");
                        setSavedMessage(null);
                        field.handleChange(event.target.value);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>

            <FormField id="account-email" label="Email" helper="Email cannot be changed here">
              {(control) => <Input {...control} type="email" value={user.email} disabled readOnly />}
            </FormField>

            <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
              {([isSubmitting, isDefaultValue]) => (
                <div className="flex justify-end">
                  <SubmitButton
                    pending={isSubmitting}
                    disabled={isDefaultValue}
                    cooldownSeconds={feedback.cooldownSeconds}
                    label="Save name"
                    pendingLabel="Saving"
                    className="sm:w-auto sm:min-w-32"
                  />
                </div>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent>
          <Link
            href="/forgot-password"
            className="flex min-h-10 items-center gap-3 rounded-lg transition-colors duration-150 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">Change password</span>
              <span className="block text-xs text-muted-foreground">
                We email you a code, then you choose a new password.
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
