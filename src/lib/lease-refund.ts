import type { TenantLease } from "@/types/lease";

export const REFUND_RESULT_LINE = "You will see the exact result on the next screen.";

/**
 * What the lease and refund rules (specs 10 and 12) say about the deposit, matched to the lease data we have.
 * `now` is passed in so the caller reads the clock at click time, not during render.
 */
export function depositRefundNotice(lease: TenantLease, now: number): string {
  const payment = lease.application?.payment;

  if (!payment) {
    return "No paid deposit is shown for this lease, so there is nothing to refund.";
  }
  if (payment.status === "REFUNDED") {
    return "The deposit for this lease is already refunded, so no further refund applies.";
  }
  if (payment.status === "REFUND_PENDING") {
    return "A deposit refund for this lease is already in progress.";
  }
  if (payment.status !== "PAID") {
    return "The deposit for this lease is not paid, so there is nothing to refund.";
  }

  if (new Date(lease.startDate).getTime() <= now) {
    return "Your lease has already started, so the deposit is not refunded.";
  }
  if (payment.gateway === "SSLCOMMERZ") {
    return "Deposits paid with SSLCommerz are refunded by our team after review, not automatically.";
  }
  return "Your lease has not started yet, so we will try to refund your deposit to the way you paid. If the refund cannot be confirmed, our team will review it.";
}

/** The consequences the backend lists for every termination (spec 10, termination step 4). */
export const TERMINATION_EFFECTS =
  "Ending the lease frees your bed, cancels your unpaid and processing invoices and removes any roommate membership. This cannot be undone.";
