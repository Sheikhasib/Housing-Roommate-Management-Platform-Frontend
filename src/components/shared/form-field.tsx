import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** First readable message from a TanStack Form error list (Standard Schema issues or strings). */
export function firstError(errors: readonly unknown[] | undefined): string | undefined {
  for (const item of errors ?? []) {
    if (typeof item === "string" && item) return item;
    if (item && typeof item === "object" && "message" in item) {
      const message = (item as { message: unknown }).message;
      if (typeof message === "string" && message) return message;
    }
  }
  return undefined;
}

interface ControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}

/** Label above the control, helper text and a linked error below it. */
export function FormField({ id, label, error, helper, required, className, children }: FormFieldProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy = [error ? errorId : null, helper ? helperId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true" className="text-muted-foreground"> *</span> : null}
      </Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy || undefined,
      })}
      {helper ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs text-error-text">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Form-level server message shown above the submit button. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm text-error-text">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

interface SubmitButtonProps {
  pending: boolean;
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  cooldownSeconds?: number;
  className?: string;
}

/** Submit button with a spinner while pending and a countdown while rate limited. */
export function SubmitButton({
  pending,
  label,
  pendingLabel,
  disabled,
  cooldownSeconds = 0,
  className,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={cn("h-10 w-full", className)}
      disabled={pending || disabled || cooldownSeconds > 0}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : label}
    </Button>
  );
}
