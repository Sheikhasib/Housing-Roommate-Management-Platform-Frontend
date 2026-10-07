import type { PaymentPurpose } from "@/validation/enums";

/** Spec 10: labels for the lowercase gateway names the backend lists. */
const GATEWAY_LABELS: Record<string, string> = {
  bkash: "bKash (BDT)",
  sslcommerz: "SSLCommerz (BDT)",
  stripe: "Stripe (card, international)",
};

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

// switch to /dashboard/leases and /dashboard/payments when parts 09 and 10b ship
export const PAYMENTS_HREF = "/dashboard/applications";

/** The next step after a PAID payment. A deposit goes to its application, which already shows the lease status. */
export function nextStepHref(
  purpose: PaymentPurpose,
  applicationId?: string,
): { href: string; label: string } {
  if (purpose === "DEPOSIT") {
    return applicationId
      ? { href: `/dashboard/applications/${encodeURIComponent(applicationId)}`, label: "View your application" }
      : { href: "/dashboard/applications", label: "View your applications" };
  }
  return { href: "/dashboard/invoices", label: "Back to invoices" };
}
