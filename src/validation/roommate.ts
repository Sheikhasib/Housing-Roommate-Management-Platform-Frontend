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

/** Mirrors the backend `InviteMembershipZodSchema` (spec 08), same rules and messages. */
export const InviteMembershipZodSchema = z.object({
  leaseId: z.string().min(1, "leaseId is required"),
  tenantEmail: z.email("tenantEmail must be a valid email"),
  message: z.string("Not a string.").max(500, "Message must be at most 500 characters").optional(),
});

export type InviteMembershipPayload = z.infer<typeof InviteMembershipZodSchema>;

/** Mirrors the backend `RespondMembershipZodSchema` (spec 08). */
export const RespondMembershipZodSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"], "Action must be ACCEPT or DECLINE"),
});

export type RespondMembershipPayload = z.infer<typeof RespondMembershipZodSchema>;

/** Mirrors the backend `RemoveMembershipZodSchema` (spec 08). */
export const RemoveMembershipZodSchema = z.object({
  reason: z.string("Not a string.").max(300, "Reason must be at most 300 characters").optional(),
});

export type RemoveMembershipPayload = z.infer<typeof RemoveMembershipZodSchema>;

export const REASON_LIMIT = 300;

export interface InviteFormValues {
  leaseId: string;
  tenantEmail: string;
  message: string;
}

type InviteField = "leaseId" | "tenantEmail" | "message";

/** An empty message is left out of the payload. */
export function buildInvitePayload(values: InviteFormValues) {
  const message = values.message.trim();
  return { leaseId: values.leaseId, tenantEmail: values.tenantEmail.trim(), ...(message ? { message } : {}) };
}

export function toInvitePayload(values: InviteFormValues): InviteMembershipPayload | null {
  const result = InviteMembershipZodSchema.safeParse(buildInvitePayload(values));
  return result.success ? result.data : null;
}

/** First message per form field from the mirrored schema. */
export function validateInviteForm(values: InviteFormValues): Partial<Record<InviteField, string>> {
  const result = InviteMembershipZodSchema.safeParse(buildInvitePayload(values));
  if (result.success) return {};
  const errors: Partial<Record<InviteField, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if ((key === "leaseId" || key === "tenantEmail" || key === "message") && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/** The remove body: an empty reason is left out. Null when it fails the schema. */
export function toRemovePayload(reason: string): RemoveMembershipPayload | null {
  const trimmed = reason.trim();
  const result = RemoveMembershipZodSchema.safeParse(trimmed ? { reason: trimmed } : {});
  return result.success ? result.data : null;
}
