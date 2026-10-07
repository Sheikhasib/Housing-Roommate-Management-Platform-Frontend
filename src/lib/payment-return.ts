import type { PaymentResultRow } from "@/components/shared/payment-result-card";
import { formatDateTime, formatMoney } from "@/lib/format";
import { gatewayLabel, isPaymentPurpose, PAYMENT_PURPOSE_LABELS } from "@/lib/payment-labels";
import type { Payment } from "@/types/payment";
import type { PaymentPurpose } from "@/validation/enums";

type RawParams = Record<string, string | string[] | undefined>;

export interface PaymentReturnHints {
  purpose?: PaymentPurpose;
  ref?: string;
  paymentId?: string;
  reason?: string;
}

function first(value: string | string[] | undefined): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  return text && text.trim() ? text.trim() : undefined;
}

/** The query of a payment return URL. These are hints only: the real payment is always re-fetched. */
export function readReturnHints(params: RawParams): PaymentReturnHints {
  const purpose = first(params.purpose);
  return {
    purpose: isPaymentPurpose(purpose) ? purpose : undefined,
    ref: first(params.ref),
    paymentId: first(params.paymentId),
    reason: first(params.reason),
  };
}

/** The same URL again, built only from the known hints, for the login redirect. */
export function returnPath(pathname: string, hints: PaymentReturnHints): string {
  const query = new URLSearchParams();
  if (hints.purpose) query.set("purpose", hints.purpose);
  if (hints.ref) query.set("ref", hints.ref);
  if (hints.paymentId) query.set("paymentId", hints.paymentId);
  if (hints.reason) query.set("reason", hints.reason);
  const text = query.toString();
  return text ? `${pathname}?${text}` : pathname;
}

/** Summary lines for the result card, built from the re-fetched payment only. */
export function paymentRows(payment: Payment, options: { paid: boolean }): PaymentResultRow[] {
  const rows: PaymentResultRow[] = [
    { label: "Amount", value: formatMoney(payment.amount) },
    { label: "Payment for", value: PAYMENT_PURPOSE_LABELS[payment.purpose] },
    { label: "Gateway", value: gatewayLabel(payment.gateway) },
  ];
  if (options.paid) {
    if (payment.bKashTrxId) rows.push({ label: "Transaction id", value: payment.bKashTrxId });
    const paidAt = payment.paidAt ? formatDateTime(payment.paidAt) : "-";
    rows.push({
      label: "Date",
      value: paidAt === "-" ? formatDateTime(payment.createdAt) : paidAt,
    });
  }
  return rows;
}
