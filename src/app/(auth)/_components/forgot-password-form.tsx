"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { FormError, FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { forgotPasswordZodSchema } from "@/validation/auth";

export function ForgotPasswordForm() {
  const feedback = useActionFeedback();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: forgotPasswordZodSchema },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const email = value.email.trim();
      const result = await forgotPasswordAction({ email });
      if (result.ok) {
        toast.success("Reset code sent. Check your email");
        setSentTo(email);
        return;
      }
      feedback.handleFailure(result, ["email"]);
    },
  });

  if (sentTo) {
    return (
      <div className="space-y-6 text-center" role="status">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-bg text-success">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-medium text-foreground">{sentTo}</span>. It works for 5
            minutes.
          </p>
        </div>
        <Link
          href={`/reset-password?email=${encodeURIComponent(sentTo)}`}
          className={cn(buttonVariants(), "h-10 w-full")}
        >
          Enter the code
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we will send you a code to reset it.</p>
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
        <form.Field name="email">
          {(field) => (
            <FormField
              id="forgot-email"
              label="Email"
              error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.email}
            >
              {(control) => (
                <Input
                  {...control}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    feedback.clearField("email");
                    field.handleChange(event.target.value);
                  }}
                />
              )}
            </FormField>
          )}
        </form.Field>

        <FormError message={feedback.formError} />

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <SubmitButton
              pending={isSubmitting}
              cooldownSeconds={feedback.cooldownSeconds}
              label="Send reset code"
              pendingLabel="Sending code"
            />
          )}
        </form.Subscribe>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
