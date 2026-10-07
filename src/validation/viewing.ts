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
