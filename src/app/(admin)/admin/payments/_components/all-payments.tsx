"use client";

import { CreditCard } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { AdminPaymentRow } from "@/types/admin";
import { PAYMENT_PURPOSES, PAYMENT_STATUSES } from "@/validation/enums";
import { useAdminPayments } from "../../_hooks/use-admin-queries";

function toOption(value: string) {
  const text = value.replaceAll("_", " ").toLowerCase();
  return { value, label: text.charAt(0).toUpperCase() + text.slice(1) };
}

const STATUS_OPTIONS = PAYMENT_STATUSES.map(toOption);
const PURPOSE_OPTIONS = PAYMENT_PURPOSES.map(toOption);

const COLUMNS: DataTableColumn<AdminPaymentRow>[] = [
  {
    key: "tenant",
    header: "Tenant",
    cell: (payment) => {
      const tenant = payment.application?.tenantProfile ?? payment.invoice?.lease?.tenantProfile ?? null;
      return tenant ? (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{tenant.name}</p>
          <p className="truncate text-xs text-muted-foreground">{tenant.email}</p>
        </div>
      ) : (
        <span className="text-muted-foreground">Not available</span>
      );
    },
  },
  {
    key: "purpose",
    header: "Purpose",
    cell: (payment) => <span className="text-sm text-foreground">{toOption(payment.purpose).label}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    cell: (payment) => <span className="text-sm font-medium text-foreground">{formatMoney(payment.amount)}</span>,
  },
  { key: "gateway", header: "Gateway", cell: (payment) => <StatusBadge status={payment.gateway} /> },
  { key: "status", header: "Status", cell: (payment) => <StatusBadge status={payment.status} /> },
  {
    key: "createdAt",
    header: "Created",
    cell: (payment) => <span className="text-sm text-muted-foreground">{formatDateTime(payment.createdAt)}</span>,
  },
];

export function AllPayments() {
  const { page, limit, getParam } = useUrlState();
  const status = getParam("status");
  const purpose = getParam("purpose");
  const query = useAdminPayments({ page, limit, status, purpose });

  const filtered = Boolean(status || purpose);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
        <FilterSelect param="purpose" label="Purpose" allLabel="All purposes" options={PURPOSE_OPTIONS} />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          caption="All payments"
          columns={COLUMNS}
          rows={query.data?.rows ?? []}
          getRowId={(payment) => payment.id}
          isLoading={query.isPending}
          empty={{
            icon: CreditCard,
            title: filtered ? "No payments match these filters" : "No payments yet",
            description: filtered ? "Try a different status or purpose." : "Payments appear here once tenants pay.",
          }}
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
