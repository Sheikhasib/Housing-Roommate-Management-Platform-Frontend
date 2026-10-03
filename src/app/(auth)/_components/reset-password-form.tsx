"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { FormError, FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { PasswordChecklist, PasswordInput } from "@/components/shared/password-input";
import { Input } from "@/components/ui/input";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { resetPasswordAction } from "@/lib/auth/actions";
import { resetPasswordZodSchema } from "@/validation/auth";

const FIELDS = ["otp", "newPassword", "email"] as const;

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const feedback = useActionFeedback();
  const [done, setDone] = useState(false);

  const form = useForm({
    defaultValues: { otp: "", newPassword: "" },
    validators: {
      onSubmit: resetPasswordZodSchema.pick({ otp: true, newPassword: true }),
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const result = await resetPasswordAction({ email, ...value });
      if (result.ok) {
        setDone(true);
        toast.success("Password changed. Log in with your new password");
        router.push("/login");
        return;
      }
      feedback.handleFailure(result, FIELDS);
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter the code we sent to <span className="font-medium text-foreground">{email}</span> and choose a new
          password.
        </p>
      </div>

      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="otp">
          {(field) => (
            <FormField
              id="reset-otp"
              label="Verification code"
              error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.otp}
            >
              {(control) => (
                <Input
                  {...control}
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  className="h-12 text-center text-lg tracking-[0.5em] md:text-lg"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    feedback.clearField("otp");
                    field.handleChange(event.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                />
              )}
            </FormField>
          )}
        </form.Field>

        <form.Field name="newPassword">
          {(field) => (
            <FormField
              id="reset-password"
              label="New password"
              error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.newPassword}
            >
              {(control) => (
                <div className="space-y-2">
                  <PasswordInput
                    {...control}
                    name="newPassword"
                    autoComplete="new-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("newPassword");
                      field.handleChange(event.target.value);
                    }}
                  />
                  <PasswordChecklist id="reset-password-rules" value={field.state.value} />
                </div>
              )}
            </FormField>
          )}
        </form.Field>

        <FormError message={feedback.formError} />

        {done ? (
          <p role="status" className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" aria-hidden />
            Password changed. Taking you to log in
          </p>
        ) : null}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <SubmitButton
              pending={isSubmitting}
              disabled={done}
              cooldownSeconds={feedback.cooldownSeconds}
              label="Reset password"
              pendingLabel="Resetting"
            />
          )}
        </form.Subscribe>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Code expired?{" "}
        <Link
          href="/forgot-password"
          className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Request a new one
        </Link>
      </p>
    </div>
  );
}
