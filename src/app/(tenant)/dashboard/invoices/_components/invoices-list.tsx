"use client";

import { Clock, Receipt, RotateCcw } from "lucide-react";

import { Can } from "@/components/shared/can";
import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate, formatMoney } from "@/lib/format";
import type { TenantInvoice } from "@/types/invoice";
import { INVOICE_STATUSES, INVOICE_TYPES } from "@/validation/enums";
import { useMyInvoices } from "../_hooks/use-invoice-queries";
import { PayInvoiceDialog } from "./pay-invoice-dialog";

const FAILED_NOTE =
  "This payment did not go through and this invoice can no longer be paid here. Please contact your property owner.";

const toOptions = (values: readonly string[]) =>
  values.map((value) => ({
    value,
    label: value.charAt(0) + value.slice(1).toLowerCase(),
  }));

const STATUS_OPTIONS = toOptions(INVOICE_STATUSES);
const TYPE_OPTIONS = toOptions(INVOICE_TYPES);

/** The invoice stays UNPAID while a payment session is open, so the payment row tells the real state. */
function isProcessing(invoice: TenantInvoice): boolean {
  return invoice.status === "PROCESSING" || invoice.payment?.status === "PROCESSING";
}

const COLUMNS: DataTableColumn<TenantInvoice>[] = [
  {
    key: "room",
    header: "Room",
    cell: (invoice) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">{invoice.room.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {invoice.room.property.title}, {invoice.room.property.city}
        </p>
      </div>
    ),
  },
  { key: "type", header: "Type", cell: (invoice) => <StatusBadge status={invoice.type} /> },
  {
    key: "period",
    header: "Period",
    cell: (invoice) => `${formatDate(invoice.periodStart)} to ${formatDate(invoice.periodEnd)}`,
  },
  { key: "dueDate", header: "Due date", cell: (invoice) => formatDate(invoice.dueDate) },
  { key: "amount", header: "Amount", cell: (invoice) => formatMoney(invoice.amount) },
  {
    key: "status",
    header: "Status",
    cell: (invoice) => (
      <StatusBadge status={isProcessing(invoice) ? "PROCESSING" : invoice.status} />
    ),
  },
];

interface RowActionsProps {
  invoice: TenantInvoice;
  checking: boolean;
  onCheckAgain: () => void;
}

function RowActions({ invoice, checking, onCheckAgain }: RowActionsProps) {
  if (isProcessing(invoice)) {
    return (
      <div className="flex max-w-56 flex-col items-start gap-2" role="status">
        <p className="flex items-start gap-1.5 text-xs text-foreground">
          <Clock className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden="true" />
          Your payment is being confirmed.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onCheckAgain} disabled={checking}>
          <RotateCcw className={checking ? "animate-spin" : undefined} aria-hidden="true" />
          Check again
        </Button>
      </div>
    );
  }
  if (invoice.status === "FAILED") {
    return <p className="max-w-56 text-xs text-muted-foreground">{FAILED_NOTE}</p>;
  }
  if (invoice.status === "UNPAID") {
    const last = invoice.payment?.status;
    const retry = last === "FAILED" || last === "CANCELLED";
    return (
      <Can permission="payments.pay">
        <PayInvoiceDialog invoice={invoice} retry={retry} />
      </Can>
    );
  }
  return null;
}

export function InvoicesList() {
  const { page, limit, getParam } = useUrlState();
  const status = getParam("status");
  const type = getParam("type");
  const query = useMyInvoices({ page, limit, status, type });

  const rows = query.data?.rows ?? [];
  const filtered = Boolean(status || type);

  const empty: DataTableEmpty = filtered
    ? {
        icon: Receipt,
        title: "No invoices match these filters",
        description: "Try a different status or type, or show all invoices.",
      }
    : {
        icon: Receipt,
        title: "No invoices yet",
        description:
          "Rent invoices start from the second month of your lease, because your deposit covers the first. Utility bills appear here when your owner adds them.",
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My invoices"
        description="Your rent and utility bills. Rent invoices start from the second month of your lease, because your booking deposit covers the first."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
        <FilterSelect param="type" label="Type" allLabel="All types" options={TYPE_OPTIONS} />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          getRowId={(invoice) => invoice.id}
          isLoading={query.isPending}
          actions={(invoice) => (
            <RowActions
              invoice={invoice}
              checking={query.isFetching}
              onCheckAgain={() => void query.refetch()}
            />
          )}
          empty={empty}
          caption="My invoices"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
