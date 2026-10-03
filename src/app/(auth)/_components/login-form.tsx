"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "@tanstack/react-form";

import { FormError, FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { GoogleAuthButton } from "@/components/shared/google-auth-button";
import { PasswordInput } from "@/components/shared/password-input";
import { Input } from "@/components/ui/input";
import { demoLoginAction, loginAction } from "@/lib/auth/actions";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { loginZodSchema } from "@/validation/auth";
import type { Role } from "@/validation/enums";

import { DemoLogin } from "./demo-login";

/** Dots only: the real demo password never reaches the browser. */
const MASKED_PASSWORD = "••••••••";
const FIELDS = ["email", "password"] as const;

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-border" />
      OR
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string | null }) {
  const feedback = useActionFeedback();
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  const [demoPending, startDemo] = useTransition();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginZodSchema },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const result = await loginAction({ ...value, redirectTo });
      if (result && !result.ok) feedback.handleFailure(result, FIELDS);
    },
  });

  function handleDemo(role: Role, email: string) {
    feedback.reset();
    form.setFieldValue("email", email);
    form.setFieldValue("password", MASKED_PASSWORD);
    setDemoRole(role);
    startDemo(async () => {
      const result = await demoLoginAction(role);
      if (result && !result.ok) {
        feedback.handleFailure(result);
        form.setFieldValue("password", "");
        setDemoRole(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to manage your rooms, rent and leases.</p>
      </div>

      <GoogleAuthButton redirectTo={redirectTo} />
      <Divider />

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
          {(field) => {
            const error = firstError(field.state.meta.errors) ?? feedback.fieldErrors.email;
            return (
              <FormField id="login-email" label="Email" error={error}>
                {(control) => (
                  <Input
                    {...control}
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    readOnly={demoPending}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("email");
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            );
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const error = firstError(field.state.meta.errors) ?? feedback.fieldErrors.password;
            return (
              <FormField id="login-password" label="Password" error={error}>
                {(control) => (
                  <PasswordInput
                    {...control}
                    name="password"
                    autoComplete="current-password"
                    value={field.state.value}
                    readOnly={demoPending}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("password");
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            );
          }}
        </form.Field>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="rounded text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Forgot password?
          </Link>
        </div>

        <FormError message={feedback.formError} />

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <SubmitButton
              pending={isSubmitting}
              disabled={demoPending}
              cooldownSeconds={feedback.cooldownSeconds}
              label="Log in"
              pendingLabel="Logging in"
            />
          )}
        </form.Subscribe>
      </form>

      <Divider />

      <DemoLogin
        pendingRole={demoPending ? demoRole : null}
        disabled={demoPending || feedback.coolingDown}
        onSelect={handleDemo}
      />

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : "/register"}
          className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
