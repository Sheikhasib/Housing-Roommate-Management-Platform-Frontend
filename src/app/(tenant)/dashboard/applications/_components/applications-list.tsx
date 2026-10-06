"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate, formatMoney } from "@/lib/format";
import type { TenantApplication } from "@/types/application";
import { APPLICATION_STATUSES } from "@/validation/enums";
import { useMyApplications } from "../_hooks/use-application-queries";

const STATUS_OPTIONS = APPLICATION_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

const COLUMNS: DataTableColumn<TenantApplication>[] = [
  {
    key: "room",
    header: "Room",
    cell: (application) => (
      <div className="min-w-0">
        <Link
          href={`/dashboard/applications/${application.id}`}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {application.room.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {application.room.property.title}, {application.room.property.city}
        </p>
      </div>
    ),
  },
  { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
  { key: "moveInDate", header: "Move-in", cell: (a) => formatDate(a.moveInDate) },
  {
    key: "leaseMonths",
    header: "Lease",
    cell: (a) => `${a.leaseMonths} ${a.leaseMonths === 1 ? "month" : "months"}`,
  },
  { key: "rent", header: "Rent", cell: (a) => formatMoney(a.room.monthlyRent) },
  { key: "createdAt", header: "Applied", cell: (a) => formatDate(a.createdAt) },
];

function RowActions({ application }: { application: TenantApplication }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link
        href={`/dashboard/applications/${application.id}`}
        aria-label={`View application for ${application.room.name}`}
      >
        View
      </Link>
    </Button>
  );
}

export function ApplicationsList() {
  const { page, limit, getParam } = useUrlState();
  const status = getParam("status");
  const query = useMyApplications({ page, limit, status });

  const rows = query.data?.rows ?? [];

  const empty: DataTableEmpty = status
    ? {
        icon: FileText,
        title: "No applications with this status",
        description: "Try a different status or show all applications.",
      }
    : {
        icon: FileText,
        title: "You have not applied to any room yet",
        description: "Find a room you like and apply from its page.",
        action: (
          <Button asChild>
            <Link href="/rooms">Browse rooms</Link>
          </Button>
        ),
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My applications"
        description="Applications expire after 14 days without a decision."
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
          getRowId={(application) => application.id}
          isLoading={query.isPending}
          actions={(application) => <RowActions application={application} />}
          empty={empty}
          caption="My applications"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
