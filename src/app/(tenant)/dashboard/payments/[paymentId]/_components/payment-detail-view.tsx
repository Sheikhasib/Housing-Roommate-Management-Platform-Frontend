import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { gatewayLabel, PAYMENT_PURPOSE_LABELS } from "@/lib/payment-labels";
import type { Payment } from "@/types/payment";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm break-words text-foreground">{children}</dd>
    </div>
  );
}

/** Where the tenant can see what this payment was for. */
function relatedLink(payment: Payment): { href: string; label: string } | null {
  if (payment.application?.id) {
    return {
      href: `/dashboard/applications/${encodeURIComponent(payment.application.id)}`,
      label: "View application",
    };
  }
  if (payment.invoice?.id) return { href: "/dashboard/invoices", label: "View invoices" };
  return null;
}

export function PaymentDetailView({ payment }: { payment: Payment }) {
  const refunded = payment.status === "REFUNDED";
  const refunding = payment.status === "REFUND_PENDING";
  const related = relatedLink(payment);
  const roomName = payment.application?.room?.name;
  const paidAt = payment.paidAt ? formatDateTime(payment.paidAt) : null;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/payments"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All payments
      </Link>

      <PageHeader
        title={`${PAYMENT_PURPOSE_LABELS[payment.purpose]} payment`}
        description={`Started on ${formatDateTime(payment.createdAt)}`}
        action={
          <>
            <StatusBadge status={payment.status} />
            {related ? (
              <Button asChild variant="outline">
                <Link href={related.href}>{related.label}</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Card title="Payment details">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label="Amount">{formatMoney(payment.amount)}</Fact>
            <Fact label="Currency">{payment.currency}</Fact>
            <Fact label="Payment for">{PAYMENT_PURPOSE_LABELS[payment.purpose]}</Fact>
            <Fact label="Gateway">{gatewayLabel(payment.gateway)}</Fact>
            <Fact label="Status">
              <StatusBadge status={payment.status} />
            </Fact>
            {roomName ? <Fact label="Room">{roomName}</Fact> : null}
            {payment.invoice?.dueDate ? (
              <Fact label="Invoice due date">{formatDate(payment.invoice.dueDate)}</Fact>
            ) : null}
            {payment.bKashTrxId ? (
              <Fact label="Transaction id">{payment.bKashTrxId}</Fact>
            ) : null}
            {paidAt ? <Fact label="Paid on">{paidAt}</Fact> : null}
          </dl>
        </Card>

        {refunded || refunding ? (
          <Card title="Refund">
            {refunding ? (
              <p className="text-sm text-muted-foreground">
                A refund for this payment is pending and has not been completed yet.
              </p>
            ) : null}
            <dl className="grid gap-4 sm:grid-cols-2">
              {payment.refundAmount ? (
                <Fact label="Refunded amount">{formatMoney(payment.refundAmount)}</Fact>
              ) : null}
              {payment.refundAt ? (
                <Fact label="Refunded on">{formatDateTime(payment.refundAt)}</Fact>
              ) : null}
              {payment.refundTrxId ? (
                <Fact label="Refund transaction id">{payment.refundTrxId}</Fact>
              ) : null}
              {payment.refundReason ? (
                <Fact label="Reason">
                  <span className="whitespace-pre-line">{payment.refundReason}</span>
                </Fact>
              ) : null}
            </dl>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
