import { z } from "zod";

/** Mirrors the backend `ApplyForRoomZodSchema` (spec 09), same messages. */
export const ApplyForRoomZodSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  moveInDate: z
    .string("Not a string.")
    .datetime({ offset: true, message: "moveInDate must be a valid date" }),
  leaseMonths: z
    .number("leaseMonths must be a number.")
    .int("leaseMonths must be an integer.")
    .min(1, "leaseMonths must be at least 1")
    .max(60, "leaseMonths cannot exceed 60"),
  roommatePairId: z.string().optional(),
  message: z.string("Not a string.").max(500, "Message must be at most 500 characters").optional(),
});

export type ApplyPayload = z.infer<typeof ApplyForRoomZodSchema>;

/** Mirrors the backend `ReviewApplicationZodSchema` (spec 09), same messages. */
export const ReviewApplicationZodSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"], "Status must be APPROVED or REJECTED"),
    rejectionReason: z.string("Not a string.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting an application",
      });
    }
  });

export type ReviewPayload = z.infer<typeof ReviewApplicationZodSchema>;

export interface ApplyFormValues {
  moveInDate: string;
  leaseMonths: string;
  message: string;
}

export interface ApplyRoomLimits {
  /** `YYYY-MM-DD` of the room's `availableFrom`, or null when it has none. */
  minDate: string | null;
  minLeaseMonths: number;
}

/** `YYYY-MM-DD` of an ISO timestamp, read in UTC because the move-in date is sent as UTC midnight. */
export function toUtcDateValue(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/** Plain-language checks run before the request. The backend repeats them and stays the authority. */
export function validateApplyForm(
  values: ApplyFormValues,
  limits: ApplyRoomLimits,
): Partial<Record<keyof ApplyFormValues, string>> {
  const errors: Partial<Record<keyof ApplyFormValues, string>> = {};

  if (!values.moveInDate) {
    errors.moveInDate = "Choose the date you want to move in";
  } else if (limits.minDate && values.moveInDate < limits.minDate) {
    errors.moveInDate = "This room is not available before the date shown. Choose a later move-in date";
  }

  const months = Number(values.leaseMonths);
  if (!values.leaseMonths.trim() || !Number.isFinite(months)) {
    errors.leaseMonths = "Enter how many months you want to stay";
  } else if (!Number.isInteger(months)) {
    errors.leaseMonths = "Enter a whole number of months";
  } else if (months < limits.minLeaseMonths) {
    errors.leaseMonths = `The minimum stay for this room is ${limits.minLeaseMonths} ${limits.minLeaseMonths === 1 ? "month" : "months"}`;
  } else if (months > 60) {
    errors.leaseMonths = "You can stay for 60 months at most";
  }

  if (values.message.length > 500) errors.message = "Keep your message to 500 characters or fewer";

  return errors;
}

/** Builds the request body and runs it through the backend schema. Returns the first issue when it fails. */
export function buildApplyPayload(
  roomId: string,
  values: ApplyFormValues,
): { ok: true; payload: ApplyPayload } | { ok: false; message: string } {
  const message = values.message.trim();
  const result = ApplyForRoomZodSchema.safeParse({
    roomId,
    moveInDate: `${values.moveInDate}T00:00:00.000Z`,
    leaseMonths: Number(values.leaseMonths),
    ...(message ? { message } : {}),
  });
  return result.success
    ? { ok: true, payload: result.data }
    : { ok: false, message: result.error.issues[0]?.message ?? "Check the form and try again" };
}
