import { z } from "zod";

/** Mirrors the backend `SendRoommateRequestZodSchema` (spec 08), same rules and messages. */
export const SendRoommateRequestZodSchema = z.object({
  receiverTenantProfileId: z.string().min(1, "receiverTenantProfileId is required"),
  message: z.string("Not a string.").max(500, "Message must be at most 500 characters").optional(),
});

export type SendRoommatePayload = z.infer<typeof SendRoommateRequestZodSchema>;

/** Mirrors the backend `RespondRoommateRequestZodSchema` (spec 08). */
export const RespondRoommateRequestZodSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"], "Status must be ACCEPTED or DECLINED"),
});

export type RespondRoommatePayload = z.infer<typeof RespondRoommateRequestZodSchema>;

export const MESSAGE_LIMIT = 500;

export interface SendRequestFormValues {
  message: string;
}

/** An empty message is left out of the payload. */
export function buildSendPayload(receiverTenantProfileId: string, values: SendRequestFormValues) {
  const message = values.message.trim();
  return { receiverTenantProfileId, ...(message ? { message } : {}) };
}

/** The typed payload, or null when it does not pass the schema. */
export function toSendPayload(
  receiverTenantProfileId: string,
  values: SendRequestFormValues,
): SendRoommatePayload | null {
  const result = SendRoommateRequestZodSchema.safeParse(buildSendPayload(receiverTenantProfileId, values));
  return result.success ? result.data : null;
}

/** First message per form field from the mirrored schema. */
export function validateSendForm(
  receiverTenantProfileId: string,
  values: SendRequestFormValues,
): Partial<Record<"message", string>> {
  const result = SendRoommateRequestZodSchema.safeParse(buildSendPayload(receiverTenantProfileId, values));
  if (result.success) return {};
  const errors: Partial<Record<"message", string>> = {};
  for (const issue of result.error.issues) {
    if (issue.path[0] === "message" && !errors.message) errors.message = issue.message;
  }
  return errors;
}
