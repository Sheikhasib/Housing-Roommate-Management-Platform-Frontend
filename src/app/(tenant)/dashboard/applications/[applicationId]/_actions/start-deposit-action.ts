"use server";

import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api/apiError";
import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { PaymentSession } from "@/types/payment";
import { StartDepositZodSchema } from "@/validation/payment";

export type StartDepositResult = { ok: false; message: string; status?: number };

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
 * Opens a deposit payment session and sends the browser to the gateway. Only returns on failure:
 * on success `redirect()` leaves the page. The amount is never sent: the backend decides it.
 * Backend guard messages (403, 409, 400) are returned as they come.
 */
export async function startDepositAction(input: {
  applicationId: string;
  gateway: string;
}): Promise<StartDepositResult> {
  const parsed = StartDepositZodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Choose a payment method" };
  }
  const { applicationId, gateway } = parsed.data;

  let paymentUrl: unknown;
  try {
    const response = await serverApi<ApiSuccess<PaymentSession>>(
      `/application/${encodeURIComponent(applicationId)}/pay-deposit`,
      { method: "POST", body: { gateway } },
    );
    paymentUrl = response.data?.paymentUrl;
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        message: error.errors[0]?.message || error.message,
        status: error.status,
      };
    }
    return { ok: false, message: "Something went wrong. Try again" };
  }

  if (!isHttpUrl(paymentUrl)) {
    return { ok: false, message: "The payment page could not be opened. Try again" };
  }
  // redirect() throws by design, so it stays outside the try block.
  redirect(paymentUrl);
}
