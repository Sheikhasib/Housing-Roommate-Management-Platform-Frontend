"use server";

import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api/apiError";
import { serverApi } from "@/lib/api/serverApi";
import { plainPaymentError } from "@/lib/payment-labels";
import type { ApiSuccess } from "@/types/api";
import type { PaymentSession } from "@/types/payment";
import { PayInvoiceZodSchema } from "@/validation/payment";

export type StartInvoicePaymentResult = { ok: false; message: string; status?: number };

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Opens a payment session for one invoice and sends the browser to the gateway. Only returns on failure:
 * on success `redirect()` leaves the page. Only the gateway is sent, the backend decides the amount.
 * Guard messages (not your invoice, not verified, already paid, payment in progress) come back as written;
 * technical failures become one plain sentence.
 */
export async function startInvoicePaymentAction(input: {
  invoiceId: string;
  gateway: string;
}): Promise<StartInvoicePaymentResult> {
  const parsed = PayInvoiceZodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Choose a payment method" };
  }
  const { invoiceId, gateway } = parsed.data;

  let paymentUrl: unknown;
  try {
    const response = await serverApi<ApiSuccess<PaymentSession>>(
      `/invoice/${encodeURIComponent(invoiceId)}/pay`,
      { method: "POST", body: { gateway } },
    );
    paymentUrl = response.data?.paymentUrl;
  } catch (error) {
    return {
      ok: false,
      message: plainPaymentError(error),
      status: error instanceof ApiError ? error.status : undefined,
    };
  }

  if (!isHttpUrl(paymentUrl)) {
    return { ok: false, message: "The payment page could not be opened. Try again" };
  }
  // redirect() throws by design, so it stays outside the try block.
  redirect(paymentUrl);
}
