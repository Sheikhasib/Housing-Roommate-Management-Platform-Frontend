import { ApiError } from "@/lib/api/apiError";
import type { ActionResult } from "@/lib/auth/actions";

type Failure = Extract<ActionResult, { ok: false }>;

/** Turns any thrown value into the failure shape `useActionFeedback` maps onto a form. */
export function toFormFailure(error: unknown): Failure {
  if (!(error instanceof ApiError)) {
    return { ok: false, message: "Something went wrong. Try again" };
  }
  const fieldErrors: Record<string, string> = {};
  for (const item of error.errors) {
    if (item.field && !(item.field in fieldErrors)) fieldErrors[item.field] = item.message;
  }
  return {
    ok: false,
    status: error.status,
    message: error.errors[0]?.message || error.message,
    fieldErrors,
  };
}
