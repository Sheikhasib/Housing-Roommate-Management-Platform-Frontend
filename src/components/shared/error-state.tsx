"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** An ApiError shows its first backend message; anything else uses `message`. */
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const DEFAULT_MESSAGE = "We could not load this. Check your connection and try again.";

function resolveMessage(error: unknown, message?: string): string {
  if (error instanceof ApiError) return error.errors[0]?.message || error.message;
  return message ?? DEFAULT_MESSAGE;
}

export function ErrorState({
  error,
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{resolveMessage(error, message)}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
