"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";

import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate } from "@/lib/format";
import { plainMaintenanceError } from "@/lib/maintenance-labels";
import type { OwnerMaintenanceRequest } from "@/types/maintenance";
import { MAINTENANCE_STATUSES, type MaintenanceStatus } from "@/validation/enums";
import { useRooms } from "../../rooms/_hooks/use-room-queries";
import { useOwnerRequests } from "../_hooks/use-owner-maintenance-queries";
import { OwnerRequestDrawer } from "./owner-request-drawer";

const STATUS_OPTIONS = MAINTENANCE_STATUSES.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).replaceAll("_", " ").toLowerCase(),
}));

const isStatus = (value: string): value is MaintenanceStatus =>
  (MAINTENANCE_STATUSES as readonly string[]).includes(value);

const COLUMNS: DataTableColumn<OwnerMaintenanceRequest>[] = [
  {
    key: "title",
    header: "Request",
    cell: (request) => <p className="max-w-64 truncate font-medium text-foreground">{request.title}</p>,
  },
  { key: "room", header: "Room", cell: (request) => request.room?.name ?? "-" },
  {
    key: "tenant",
    header: "Tenant",
    cell: (request) =>
      request.tenantProfile ? (
        <div className="min-w-0">
          <p className="truncate text-foreground">{request.tenantProfile.name}</p>
          <p className="truncate text-xs text-muted-foreground">{request.tenantProfile.email}</p>
        </div>
      ) : (
        "-"
      ),
  },
  { key: "priority", header: "Priority", cell: (request) => <StatusBadge status={request.priority} /> },
  { key: "status", header: "Status", cell: (request) => <StatusBadge status={request.status} /> },
  { key: "createdAt", header: "Sent on", cell: (request) => formatDate(request.createdAt) },
];

export function OwnerMaintenanceList() {
  const { role } = useRole();
  const { page, limit, getParam } = useUrlState();
  const isManager = role === "PROPERTY_MANAGER";

  const rawStatus = getParam("status");
  const status = isStatus(rawStatus) ? rawStatus : "";
  const roomId = getParam("roomId");

  // Same room source as the invoices page: the owner list, or the rooms of a manager's properties.
  const rooms = useRooms(isManager, role !== null, { page: 1, limit: 100 });
  const query = useOwnerRequests({ page, limit, status, roomId }, role !== null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<OwnerMaintenanceRequest | null>(null);

  const roomOptions = (rooms.data?.rows ?? []).map((room) => ({
    value: room.id,
    label: `${room.name}, ${room.property.title}`,
  }));

  const rows = query.data?.rows ?? [];
  // Keep the drawer open on the last row seen if a refresh moves it out of the current filter.
  const selected = selectedId
    ? (rows.find((request) => request.id === selectedId) ??
      (lastSeen?.id === selectedId ? lastSeen : null))
    : null;

  const open = (request: OwnerMaintenanceRequest) => {
    setLastSeen(request);
    setSelectedId(request.id);
  };

  const filtered = Boolean(status || roomId);
  const empty: DataTableEmpty = filtered
    ? {
        icon: Wrench,
        title: "No requests match these filters",
        description: "Try a different status or room, or show all requests.",
      }
    : {
        icon: Wrench,
        title: "No requests for your rooms",
        description: isManager
          ? "Requests from tenants appear here for the properties assigned to you."
          : "When a tenant reports a problem in one of your rooms, it appears here.",
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Problems reported by tenants in your rooms. Move each one forward until it is fixed."
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
          <ErrorState message={plainMaintenanceError(query.error)} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          getRowId={(request) => request.id}
          isLoading={role === null || query.isPending}
          actions={(request) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => open(request)}
              aria-label={`View request: ${request.title}`}
            >
              View
            </Button>
          )}
          empty={empty}
          caption="Maintenance requests for your rooms"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}

      <OwnerRequestDrawer request={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
