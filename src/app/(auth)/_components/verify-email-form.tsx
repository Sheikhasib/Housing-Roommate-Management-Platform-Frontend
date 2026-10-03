"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Clock } from "lucide-react";

import { FormError, FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { verifyEmailAction } from "@/lib/auth/actions";
import { verifyEmailZodSchema } from "@/validation/auth";

const OTP_SECONDS = 5 * 60;

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VerifyEmailForm({ email, redirectTo }: { email: string; redirectTo: string | null }) {
  const feedback = useActionFeedback();
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);
  const [needsNewCode, setNeedsNewCode] = useState(false);
  const endsAt = useRef<number | null>(null);

  useEffect(() => {
    endsAt.current = Date.now() + OTP_SECONDS * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil(((endsAt.current ?? 0) - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const expired = secondsLeft === 0 || needsNewCode;

  const form = useForm({
    defaultValues: { otp: "" },
    validators: { onSubmit: verifyEmailZodSchema.pick({ otp: true }) },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const result = await verifyEmailAction({ email, otp: value.otp, redirectTo });
      if (result && !result.ok) {
        feedback.handleFailure(result, ["otp"]);
        // 400 expired and 404 "registration data not found" both need a fresh registration.
        if (result.status === 404 || (result.status === 400 && /expired/i.test(result.message))) {
          setNeedsNewCode(true);
        }
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Verify your email</h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we sent to <span className="font-medium text-foreground">{email}</span>.
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
              id="verify-otp"
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

        <p
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"
          role="timer"
          aria-live="off"
        >
          <Clock className="size-4" aria-hidden />
          {secondsLeft > 0 ? `Code expires in ${formatClock(secondsLeft)}` : "This code has expired"}
        </p>

        <FormError message={feedback.formError} />

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <SubmitButton
              pending={isSubmitting}
              disabled={expired}
              cooldownSeconds={feedback.cooldownSeconds}
              label="Verify email"
              pendingLabel="Verifying"
            />
          )}
        </form.Subscribe>
      </form>

      {expired ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            We cannot send a new code from here. Register again to get a fresh one.
          </p>
          <Link
            href={redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : "/register"}
            className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Register again
          </Link>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link
            href="/register"
            className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Start again
          </Link>
        </p>
      )}
    </div>
  );
}
