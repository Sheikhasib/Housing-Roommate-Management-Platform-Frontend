import { z } from "zod";

/** Mirrors the backend `TerminateLeaseZodSchema` (spec 10), same messages. */
export const TerminateLeaseZodSchema = z.object({
  reason: z
    .string("Not a string.")
    .min(3, "Reason must be at least 3 characters long")
    .max(300, "Reason must be at most 300 characters"),
});

export type TerminateLeasePayload = z.infer<typeof TerminateLeaseZodSchema>;
