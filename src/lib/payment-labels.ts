import { ApiError } from "@/lib/api/apiError";
import type { PaymentPurpose } from "@/validation/enums";

/** Spec 10: labels for the lowercase gateway names the backend lists. */
const GATEWAY_LABELS: Record<string, string> = {
  bkash: "bKash (BDT)",
  sslcommerz: "SSLCommerz (BDT)",
  stripe: "Stripe (card, international)",
};

/** The short gateway name for badges and table cells: "bKash", "SSLCommerz", "Stripe". */
export function gatewayShortLabel(name: string): string {
  return gatewayLabel(name).replace(/\s*\(.*\)$/, "");
}

/** Works for the request value (`bkash`) and the stored value (`BKASH`). An unknown name is shown as listed. */
export function gatewayLabel(name: string): string {
  return GATEWAY_LABELS[name.toLowerCase()] ?? name;
}

export const PAYMENT_PURPOSE_LABELS: Record<PaymentPurpose, string> = {
  DEPOSIT: "Booking deposit",
  RENT: "Rent",
  UTILITY: "Utility bill",
};

export function isPaymentPurpose(value: string | undefined): value is PaymentPurpose {
  return value === "DEPOSIT" || value === "RENT" || value === "UTILITY";
}

/** Where "Try again" goes: the application page for a deposit, the invoices page for rent or utility. */
export function retryHref(purpose: PaymentPurpose | undefined, applicationId?: string): string {
  if (purpose === "DEPOSIT") {
    return applicationId
      ? `/dashboard/applications/${encodeURIComponent(applicationId)}`
      : "/dashboard/applications";
  }
  return "/dashboard/invoices";
}

/** Every "View payments" link on the payment return pages goes to the tenant payment history. */
export const PAYMENTS_HREF = "/dashboard/payments";

const GENERIC_PAYMENT_ERROR = "Something went wrong. Try again";
const GATEWAY_DOWN_ERROR =
  "The payment service is not responding right now. Please try again in a moment.";
const TECHNICAL_MESSAGE =
  /token|duplicate key|prisma|econn|etimedout|timeout|unexpected|internal|undefined|null|stack|exception|failed to/i;

/**
 * The text to show for a failed payment call. Guard messages the backend writes for people (403, 409, 400)
 * come through as they are. A gateway or server failure, or a message that reads like a technical error,
 * becomes one plain sentence so nobody sees internal wording.
 */
export function plainPaymentError(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_PAYMENT_ERROR;
  const message = (error.errors[0]?.message || error.message || "").trim();
  if (error.status >= 500) return GATEWAY_DOWN_ERROR;
  if (!message || message === "Something went wrong") return GENERIC_PAYMENT_ERROR;
  if (TECHNICAL_MESSAGE.test(message) && error.status !== 403 && error.status !== 409) {
    return GENERIC_PAYMENT_ERROR;
  }
  return message;
}

/**
 * The next step after a PAID payment. A deposit goes to its lease when the lease id is known,
 * otherwise to its application, which also shows the lease status.
 */
export function nextStepHref(
  purpose: PaymentPurpose,
  applicationId?: string,
  leaseId?: string | null,
): { href: string; label: string } {
  if (purpose === "DEPOSIT" && leaseId) {
    return { href: `/dashboard/leases/${encodeURIComponent(leaseId)}`, label: "View your lease" };
  }
  if (purpose === "DEPOSIT") {
    return applicationId
      ? { href: `/dashboard/applications/${encodeURIComponent(applicationId)}`, label: "View your application" }
      : { href: "/dashboard/applications", label: "View your applications" };
  }
  return { href: "/dashboard/invoices", label: "Back to invoices" };
}
