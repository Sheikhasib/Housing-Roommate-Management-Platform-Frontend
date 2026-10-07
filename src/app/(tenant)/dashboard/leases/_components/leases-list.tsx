"use client";

import Link from "next/link";
import { ScrollText } from "lucide-react";

import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate, formatMoney } from "@/lib/format";
import type { TenantLease } from "@/types/lease";
import { LEASE_STATUSES } from "@/validation/enums";
import { useMyLeases } from "../_hooks/use-lease-queries";

const STATUS_OPTIONS = LEASE_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

const COLUMNS: DataTableColumn<TenantLease>[] = [
  {
    key: "room",
    header: "Room",
    cell: (lease) => (
      <div className="min-w-0">
        <Link
          href={`/dashboard/leases/${lease.id}`}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {lease.room.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {lease.room.property.title}, {lease.room.property.city}
        </p>
      </div>
    ),
  },
  { key: "status", header: "Status", cell: (lease) => <StatusBadge status={lease.status} /> },
  { key: "monthlyRent", header: "Rent", cell: (lease) => formatMoney(lease.monthlyRent) },
  { key: "startDate", header: "Start date", cell: (lease) => formatDate(lease.startDate) },
  { key: "endDate", header: "End date", cell: (lease) => formatDate(lease.endDate) },
];

function RowActions({ lease }: { lease: TenantLease }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/dashboard/leases/${lease.id}`} aria-label={`View lease for ${lease.room.name}`}>
        View
      </Link>
    </Button>
  );
}

export function LeasesList() {
  const { page, limit, getParam } = useUrlState();
  const status = getParam("status");
  const query = useMyLeases({ page, limit, status });

  const rows = query.data?.rows ?? [];

  const empty: DataTableEmpty = status
    ? {
        icon: ScrollText,
        title: "No leases with this status",
        description: "Try a different status or show all leases.",
      }
    : {
        icon: ScrollText,
        title: "No leases yet",
        description: "A lease is created when your deposit payment succeeds. Find a room to get started.",
        action: (
          <Button asChild>
            <Link href="/rooms">Browse rooms</Link>
          </Button>
        ),
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My leases"
        description="Your tenancies. A lease is created when your booking deposit is paid."
      />

      <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          getRowId={(lease) => lease.id}
          isLoading={query.isPending}
          actions={(lease) => <RowActions lease={lease} />}
          empty={empty}
          caption="My leases"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
