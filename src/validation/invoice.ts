import { z } from "zod";

/** Mirrors the backend `CreateUtilityBillZodSchema` (spec 10), same messages. */
export const CreateUtilityBillZodSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  amount: z.number("amount must be a number.").positive("amount must be positive"),
  periodStart: z
    .string("Not a string.")
    .datetime({ offset: true, message: "periodStart must be a valid date" }),
  periodEnd: z
    .string("Not a string.")
    .datetime({ offset: true, message: "periodEnd must be a valid date" }),
  dueDate: z
    .string("Not a string.")
    .datetime({ offset: true, message: "dueDate must be a valid date" }),
  description: z.string("Not a string.").optional(),
});

export type CreateUtilityBillPayload = z.infer<typeof CreateUtilityBillZodSchema>;
