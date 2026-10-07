import { z } from "zod";

import type { ViewingTimeSlot } from "@/validation/enums";

/** Mirrors the backend `CreateViewingRequestZodSchema` (spec 07), same messages. */
export const CreateViewingRequestZodSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  preferredDate: z
    .string("Not a string.")
    .datetime({ offset: true, message: "preferredDate must be a valid date" }),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"], "Invalid time slot.").optional(),
  message: z.string("Not a string.").max(500, "Message must be at most 500 characters").optional(),
});

export type ViewingPayload = z.infer<typeof CreateViewingRequestZodSchema>;

export const VIEWING_MESSAGE_LIMIT = 500;

export interface ViewingFormValues {
  preferredDate: string;
  timeSlot: ViewingTimeSlot;
  message: string;
}

/** Today as `YYYY-MM-DD` in the visitor's own calendar, the earliest date the input accepts. */
export function todayDateValue(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Plain-language checks run before the request. The backend repeats them and stays the authority. */
export function validateViewingForm(
  values: ViewingFormValues,
  minDate: string,
): Partial<Record<keyof ViewingFormValues, string>> {
  const errors: Partial<Record<keyof ViewingFormValues, string>> = {};
  if (!values.preferredDate) {
    errors.preferredDate = "Choose the day you would like to see the room";
  } else if (values.preferredDate < minDate) {
    errors.preferredDate = "Choose today or a later day";
  }
  if (values.message.length > VIEWING_MESSAGE_LIMIT) {
    errors.message = "Keep your message to 500 characters or fewer";
  }
  return errors;
}

/** Builds the request body and runs it through the backend schema. Returns the first issue when it fails. */
export function buildViewingPayload(
  roomId: string,
  values: ViewingFormValues,
): { ok: true; payload: ViewingPayload } | { ok: false; message: string } {
  const message = values.message.trim();
  const result = CreateViewingRequestZodSchema.safeParse({
    roomId,
    preferredDate: `${values.preferredDate}T00:00:00.000Z`,
    timeSlot: values.timeSlot,
    ...(message ? { message } : {}),
  });
  return result.success
    ? { ok: true, payload: result.data }
    : { ok: false, message: result.error.issues[0]?.message ?? "Check the form and try again" };
}

/** Mirrors the backend `UpdateViewingStatusZodSchema` (spec 07), same rules and messages. */
export const UpdateViewingStatusZodSchema = z
  .object({
    status: z.enum(
      ["APPROVED", "REJECTED", "COMPLETED"],
      "Status must be APPROVED, REJECTED or COMPLETED",
    ),
    scheduledDateTime: z
      .string("Not a string.")
      .datetime({ offset: true, message: "scheduledDateTime must be a valid date" })
      .optional(),
    rejectionReason: z.string("Not a string.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting a viewing request",
      });
    }
  });

export type UpdateViewingStatusPayload = z.infer<typeof UpdateViewingStatusZodSchema>;

export const PARTIAL_SCHEDULE_TEXT = "Choose a time as well, or leave both empty.";
export const SCHEDULE_DATE_REQUIRED_TEXT = "Choose the day as well, or leave both empty.";
export const REJECTION_REASON_REQUIRED = "Rejection reason is required when rejecting a viewing request";

export interface ApproveFormValues {
  date: string;
  time: string;
}

export type ApproveField = keyof ApproveFormValues;

/** A half-filled schedule is refused; an empty one is allowed (the server then uses the preferred day). */
export function validateApproveForm(values: ApproveFormValues): Partial<Record<ApproveField, string>> {
  if (values.date && !values.time) return { time: PARTIAL_SCHEDULE_TEXT };
  if (values.time && !values.date) return { date: SCHEDULE_DATE_REQUIRED_TEXT };
  return {};
}

/** Local date and time to an ISO datetime with offset, or undefined when both are empty. */
export function toScheduledDateTime(values: ApproveFormValues): string | undefined {
  if (!values.date || !values.time) return undefined;
  const parsed = new Date(`${values.date}T${values.time}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}
