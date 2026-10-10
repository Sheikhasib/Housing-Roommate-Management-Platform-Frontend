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
import { useRole } from "@/hooks/useRole";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate, formatMoney } from "@/lib/format";
import type { OwnerLeaseRow } from "@/types/lease";
import { LEASE_STATUSES } from "@/validation/enums";
import { useRooms } from "../../rooms/_hooks/use-room-queries";
import { useOwnerLeases } from "../_hooks/use-owner-lease-queries";

const STATUS_OPTIONS = LEASE_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

const COLUMNS: DataTableColumn<OwnerLeaseRow>[] = [
  {
    key: "tenant",
    header: "Tenant",
    cell: (lease) => (
      <Link
        href={`/owner/leases/${lease.id}`}
        title={lease.tenantProfile.name}
        className="block max-w-56 truncate font-medium text-foreground hover:text-primary hover:underline"
      >
        {lease.tenantProfile.name}
      </Link>
    ),
  },
  { key: "room", header: "Room", wrap: true, cell: (lease) => lease.room.name },
  { key: "monthlyRent", header: "Rent", cell: (lease) => formatMoney(lease.monthlyRent) },
  { key: "startDate", header: "Start date", cell: (lease) => formatDate(lease.startDate) },
  { key: "endDate", header: "End date", cell: (lease) => formatDate(lease.endDate) },
  { key: "status", header: "Status", cell: (lease) => <StatusBadge status={lease.status} /> },
];

function RowActions({ lease }: { lease: OwnerLeaseRow }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link
        href={`/owner/leases/${lease.id}`}
        aria-label={`View lease of ${lease.tenantProfile.name} for ${lease.room.name}`}
      >
        View
      </Link>
    </Button>
  );
}

export function OwnerLeasesList() {
  const { role } = useRole();
  const { page, limit, getParam } = useUrlState();
  const isManager = role === "PROPERTY_MANAGER";

  const status = getParam("status");
  const roomId = getParam("roomId");

  const query = useOwnerLeases({ page, limit, status, roomId }, role !== null);
  // Same room source as the rooms page: the owner list, or the rooms of a manager's properties.
  const rooms = useRooms(isManager, role !== null, { page: 1, limit: 100 });

  const rows = query.data?.rows ?? [];
  const loading = role === null || query.isPending;
  const roomOptions = (rooms.data?.rows ?? []).map((room) => ({
    value: room.id,
    label: `${room.name}, ${room.property.title}`,
  }));

  const empty: DataTableEmpty =
    status || roomId
      ? {
          icon: ScrollText,
          title: "No leases match these filters",
          description: "Try a different status or show all rooms.",
        }
      : {
          icon: ScrollText,
          title: "No leases for your rooms",
          description: isManager
            ? "Leases appear here for the properties an owner has assigned to you."
            : "A lease is created when a tenant's deposit payment succeeds.",
        };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leases"
        description={
          isManager
            ? "Leases for the properties assigned to you. You can view them but not change them."
            : "Leases for your rooms. A lease is created when a tenant's deposit is paid."
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
        <FilterSelect
          param="roomId"
          label="Room"
          allLabel="All rooms"
          options={roomOptions}
          className="sm:w-72"
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
          getRowId={(lease) => lease.id}
          isLoading={loading}
          actions={(lease) => <RowActions lease={lease} />}
          empty={empty}
          caption="Leases for my rooms"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
