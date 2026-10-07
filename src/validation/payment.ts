import { z } from "zod";

import { PAYMENT_GATEWAY_REQUEST_VALUES } from "@/validation/enums";

/**
 * Mirrors the backend `PayInvoiceZodSchema` (spec 10), same message. The deposit session takes the
 * same optional `gateway` (backend spec 12); the deposit schema itself is not printed in the backend docs.
 */
export const PayGatewayZodSchema = z.object({
  gateway: z.enum(PAYMENT_GATEWAY_REQUEST_VALUES, "Unsupported payment gateway"),
});

export const StartDepositZodSchema = PayGatewayZodSchema.extend({
  applicationId: z.string().min(1, "applicationId is required"),
});

/** Mirrors the backend `PayInvoiceZodSchema` (spec 10): only the gateway is sent, the backend decides the amount. */
export const PayInvoiceZodSchema = PayGatewayZodSchema.extend({
  invoiceId: z.string().min(1, "invoiceId is required"),
});
