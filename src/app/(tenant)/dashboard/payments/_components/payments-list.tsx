"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";

import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDateTime, formatMoney } from "@/lib/format";
import { gatewayLabel, PAYMENT_PURPOSE_LABELS } from "@/lib/payment-labels";
import type { Payment } from "@/types/payment";
import { PAYMENT_PURPOSES, PAYMENT_STATUSES } from "@/validation/enums";
import { useMyPayments } from "../_hooks/use-payment-queries";

const STATUS_OPTIONS = PAYMENT_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " "),
}));

const PURPOSE_OPTIONS = PAYMENT_PURPOSES.map((purpose) => ({
  value: purpose,
  label: PAYMENT_PURPOSE_LABELS[purpose],
}));

const COLUMNS: DataTableColumn<Payment>[] = [
  { key: "amount", header: "Amount", cell: (payment) => formatMoney(payment.amount) },
  {
    key: "purpose",
    header: "Payment for",
    wrap: true,
    cell: (payment) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">{PAYMENT_PURPOSE_LABELS[payment.purpose]}</p>
        {payment.application?.room?.name ? (
          <p className="text-xs text-muted-foreground">{payment.application.room.name}</p>
        ) : null}
      </div>
    ),
  },
  { key: "gateway", header: "Gateway", cell: (payment) => gatewayLabel(payment.gateway) },
  { key: "status", header: "Status", cell: (payment) => <StatusBadge status={payment.status} /> },
  {
    key: "date",
    header: "Date",
    cell: (payment) => formatDateTime(payment.paidAt || payment.createdAt),
  },
];

function RowActions({ payment }: { payment: Payment }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link
        href={`/dashboard/payments/${payment.id}`}
        aria-label={`View ${PAYMENT_PURPOSE_LABELS[payment.purpose].toLowerCase()} payment of ${formatMoney(payment.amount)}`}
      >
        View
      </Link>
    </Button>
  );
}

export function PaymentsList() {
  const { page, limit, getParam } = useUrlState();
  const status = getParam("status");
  const purpose = getParam("purpose");
  const query = useMyPayments({ page, limit, status, purpose });

  const rows = query.data?.rows ?? [];

  const empty: DataTableEmpty =
    status || purpose
      ? {
          icon: CreditCard,
          title: "No payments match these filters",
          description: "Try a different status or purpose, or show all payments.",
        }
      : {
          icon: CreditCard,
          title: "No payments yet",
          description: "Your deposit, rent and utility payments will be listed here.",
          action: (
            <Button asChild>
              <Link href="/dashboard/invoices">View invoices</Link>
            </Button>
          ),
        };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My payments"
        description="Every payment you started, with its latest status."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
        <FilterSelect
          param="purpose"
          label="Payment for"
          allLabel="All payments"
          options={PURPOSE_OPTIONS}
        />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          getRowId={(payment) => payment.id}
          isLoading={query.isPending}
          actions={(payment) => <RowActions payment={payment} />}
          empty={empty}
          caption="My payments"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
