import { ApiError } from "@/lib/api/apiError";
import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { Payment } from "@/types/payment";
import type { PaymentPurpose } from "@/validation/enums";

/** One payment, read with the user's token. The backend allows only the payer (403 otherwise). */
export async function getPaymentById(paymentId: string): Promise<Payment> {
  const response = await serverApi<ApiSuccess<Payment>>(
    `/payment/${encodeURIComponent(paymentId)}`,
  );
  return response.data;
}

const REF_SEARCH_LIMIT = 50;

/**
 * When the redirect carries no `paymentId`: the tenant's payments for the purpose, matched on `ref`
 * (the application id for a deposit, the invoice id for rent or utility). Returns null when none matches.
 */
export async function findPaymentByRef(
  ref: string,
  purpose?: PaymentPurpose,
): Promise<Payment | null> {
  const response = await serverApi<ApiSuccess<Payment[]>>("/payment/my-payments", {
    query: { limit: REF_SEARCH_LIMIT, ...(purpose ? { purpose } : {}) },
  });
  return (
    response.data.find(
      (row) =>
        row.application?.id === ref || row.invoice?.id === ref || row.merchantInvoiceNumber === ref,
    ) ?? null
  );
}

export type PaymentLookup =
  | { kind: "found"; payment: Payment }
  | { kind: "missing"; message?: string }
  | { kind: "denied"; message: string };

/**
 * Resolves the real payment from the return URL hints. 403 and 404 come back as data so the page
 * can show the backend message as it is; any other failure is thrown to error.tsx.
 */
export async function resolvePayment(hints: {
  paymentId?: string;
  ref?: string;
  purpose?: PaymentPurpose;
}): Promise<PaymentLookup> {
  const { paymentId, ref, purpose } = hints;
  if (!paymentId && !ref) return { kind: "missing" };
  try {
    const payment = paymentId
      ? await getPaymentById(paymentId)
      : await findPaymentByRef(ref as string, purpose);
    return payment ? { kind: "found", payment } : { kind: "missing" };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      const message = error.errors[0]?.message || error.message;
      return error.status === 404 ? { kind: "missing", message } : { kind: "denied", message };
    }
    throw error;
  }
}
