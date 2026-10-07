"use client";

import { useState } from "react";
import { Plus, Wrench } from "lucide-react";

import { Can } from "@/components/shared/can";
import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate } from "@/lib/format";
import { plainMaintenanceError } from "@/lib/maintenance-labels";
import type { TenantMaintenanceRequest } from "@/types/maintenance";
import { MAINTENANCE_STATUSES, type MaintenanceStatus } from "@/validation/enums";
import { useActiveLeaseRooms, useMyRequests } from "../_hooks/use-maintenance-queries";
import { NewRequestDialog } from "./new-request-dialog";
import { RequestDrawer } from "./request-drawer";

const NO_LEASE_NOTE = "You need an active lease to report a problem.";

const STATUS_OPTIONS = MAINTENANCE_STATUSES.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).replaceAll("_", " ").toLowerCase(),
}));

const isStatus = (value: string): value is MaintenanceStatus =>
  (MAINTENANCE_STATUSES as readonly string[]).includes(value);

function buildColumns(): DataTableColumn<TenantMaintenanceRequest>[] {
  return [
    {
      key: "title",
      header: "Request",
      cell: (request) => (
        <p className="max-w-64 truncate font-medium text-foreground">{request.title}</p>
      ),
    },
    {
      key: "room",
      header: "Room",
      cell: (request) =>
        request.room ? (
          <div className="min-w-0">
            <p className="text-foreground">{request.room.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {request.room.property.title}, {request.room.property.city}
            </p>
          </div>
        ) : (
          "-"
        ),
    },
    { key: "priority", header: "Priority", cell: (request) => <StatusBadge status={request.priority} /> },
    { key: "status", header: "Status", cell: (request) => <StatusBadge status={request.status} /> },
    { key: "createdAt", header: "Sent on", cell: (request) => formatDate(request.createdAt) },
  ];
}

const COLUMNS = buildColumns();

export function MaintenanceList() {
  const { page, limit, getParam } = useUrlState();
  const rawStatus = getParam("status");
  const status = isStatus(rawStatus) ? rawStatus : "";
  const query = useMyRequests({ page, limit, status });
  const leases = useActiveLeaseRooms();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = query.data?.rows ?? [];
  const selected = rows.find((request) => request.id === selectedId) ?? null;
  const rooms = leases.data ?? [];

  const noActiveLease = leases.isSuccess && rooms.length === 0;
  const canCreate = leases.isSuccess && rooms.length > 0;

  const createButton = (
    <Button type="button" onClick={() => setDialogOpen(true)} disabled={!canCreate}>
      <Plus aria-hidden="true" />
      New request
    </Button>
  );

  const empty: DataTableEmpty = status
    ? {
        icon: Wrench,
        title: "No requests match this filter",
        description: "Try a different status, or show all requests.",
      }
    : {
        icon: Wrench,
        title: "No requests yet",
        description: noActiveLease
          ? NO_LEASE_NOTE
          : "When something in your room needs fixing, send a request and follow it here.",
        action: createButton,
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Report a problem in your room and follow it until it is fixed."
        action={<Can permission="maintenance.report">{createButton}</Can>}
      />

      {noActiveLease ? (
        <p className="text-sm text-muted-foreground" role="status">
          {NO_LEASE_NOTE}
        </p>
      ) : null}
      {leases.isError ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" role="status">
          We could not check your lease, so new requests are paused.
          <Button type="button" variant="outline" size="sm" onClick={() => void leases.refetch()}>
            Try again
          </Button>
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState
            message={plainMaintenanceError(query.error)}
            onRetry={() => void query.refetch()}
          />
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          getRowId={(request) => request.id}
          isLoading={query.isPending}
          actions={(request) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedId(request.id)}
              aria-label={`View request: ${request.title}`}
            >
              View
            </Button>
          )}
          empty={empty}
          caption="My maintenance requests"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}

      <NewRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} rooms={rooms} />
      <RequestDrawer request={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
