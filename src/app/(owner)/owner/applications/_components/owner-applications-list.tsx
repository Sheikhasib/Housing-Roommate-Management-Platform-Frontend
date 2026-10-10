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
import { useRole } from "@/hooks/useRole";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate } from "@/lib/format";
import type { OwnerApplicationRow } from "@/types/owner-application";
import { APPLICATION_STATUSES } from "@/validation/enums";
import { useRooms } from "../../rooms/_hooks/use-room-queries";
import { useOwnerApplications } from "../_hooks/use-owner-application-queries";

/** Usability default, not a backend rule: the main task is reviewing pending applications. */
const DEFAULT_STATUS = "PENDING";
/** The URL value for "no status filter", so the PENDING default can be switched off. */
const ALL_STATUSES = "ALL";

const STATUS_OPTIONS = [
  { value: ALL_STATUSES, label: "All statuses" },
  ...APPLICATION_STATUSES.map((status) => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
  })),
];

const COLUMNS: DataTableColumn<OwnerApplicationRow>[] = [
  {
    key: "tenant",
    header: "Tenant",
    cell: (application) => (
      <Link
        href={`/owner/applications/${application.id}`}
        title={application.tenantProfile.name}
        className="block max-w-56 truncate font-medium text-foreground hover:text-primary hover:underline"
      >
        {application.tenantProfile.name}
      </Link>
    ),
  },
  { key: "room", header: "Room", wrap: true, cell: (a) => a.room.name },
  { key: "moveInDate", header: "Move-in", cell: (a) => formatDate(a.moveInDate) },
  {
    key: "leaseMonths",
    header: "Lease",
    cell: (a) => `${a.leaseMonths} ${a.leaseMonths === 1 ? "month" : "months"}`,
  },
  { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
];

function RowActions({ application }: { application: OwnerApplicationRow }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link
        href={`/owner/applications/${application.id}`}
        aria-label={`View application from ${application.tenantProfile.name} for ${application.room.name}`}
      >
        View
      </Link>
    </Button>
  );
}

export function OwnerApplicationsList() {
  const { role } = useRole();
  const { page, limit, getParam } = useUrlState();
  const isManager = role === "PROPERTY_MANAGER";

  const statusParam = getParam("status") || DEFAULT_STATUS;
  const status = statusParam === ALL_STATUSES ? undefined : statusParam;
  const roomId = getParam("roomId");

  const query = useOwnerApplications({ page, limit, status, roomId }, role !== null);
  // Same room source as the rooms page: the owner list, or the rooms of a manager's properties.
  const rooms = useRooms(isManager, role !== null, { page: 1, limit: 100 });

  const rows = query.data?.rows ?? [];
  const loading = role === null || query.isPending;
  const roomOptions = (rooms.data?.rows ?? []).map((room) => ({
    value: room.id,
    label: `${room.name}, ${room.property.title}`,
  }));

  const empty: DataTableEmpty = roomId
    ? {
        icon: FileText,
        title: "No applications match these filters",
        description: "Try a different status or show all rooms.",
      }
    : status
      ? {
          icon: FileText,
          title: `No ${status.toLowerCase()} applications`,
          description: 'Choose "All statuses" to see every application for your rooms.',
        }
      : {
        icon: FileText,
        title: "No applications for your rooms",
        description: isManager
          ? "Applications appear here for the properties an owner has assigned to you."
          : "Applications appear here when a tenant applies to one of your published rooms.",
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Review applications for your rooms. Applications expire after 14 days without a decision."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <FilterSelect
          param="status"
          label="Status"
          defaultValue={DEFAULT_STATUS}
          options={STATUS_OPTIONS}
        />
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
          getRowId={(application) => application.id}
          isLoading={loading}
          actions={(application) => <RowActions application={application} />}
          empty={empty}
          caption="Applications for my rooms"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
