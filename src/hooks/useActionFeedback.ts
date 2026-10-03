"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/auth/actions";

const COOLDOWN_SECONDS = 30;

type Failure = Extract<ActionResult, { ok: false }>;

/**
 * Server-side feedback for an auth form: errors mapped to fields, a form-level message,
 * and a short disabled period after a 429 (rate limit).
 */
export function useActionFeedback() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const reset = useCallback(() => {
    setFieldErrors({});
    setFormError(null);
  }, []);

  const clearField = useCallback((name: string) => {
    setFieldErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  /** Maps a failed action onto the form. Fields with an error get inline text, the rest a toast. */
  const handleFailure = useCallback((result: Failure, knownFields: readonly string[] = []) => {
    const mapped: Record<string, string> = {};
    for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
      if (knownFields.includes(name)) mapped[name] = message;
    }
    setFieldErrors(mapped);
    setFormError(result.message);
    toast.error(result.message);
    if (result.status === 429) setSecondsLeft(COOLDOWN_SECONDS);
  }, []);

  return {
    fieldErrors,
    formError,
    cooldownSeconds: secondsLeft,
    coolingDown: secondsLeft > 0,
    reset,
    clearField,
    handleFailure,
  };
}
