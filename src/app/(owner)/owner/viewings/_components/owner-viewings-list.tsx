"use client";

import { CalendarClock } from "lucide-react";

import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRole } from "@/hooks/useRole";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate, formatMoney } from "@/lib/format";
import { formatScheduled, plainViewingError, TIME_SLOT_LABELS } from "@/lib/viewing-labels";
import type { OwnerViewing } from "@/types/viewing";
import { VIEWING_STATUSES, type ViewingStatus } from "@/validation/enums";
import { useRooms } from "../../rooms/_hooks/use-room-queries";
import { useOwnerViewings } from "../_hooks/use-owner-viewing-queries";
import { ViewingDecision } from "./viewing-decision";

const STATUS_OPTIONS = VIEWING_STATUSES.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}));

const isStatus = (value: string): value is ViewingStatus =>
  (VIEWING_STATUSES as readonly string[]).includes(value);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const COLUMNS: DataTableColumn<OwnerViewing>[] = [
  {
    key: "tenant",
    header: "Tenant",
    cell: (viewing) => {
      const tenant = viewing.tenantProfile;
      if (!tenant) return "-";
      return (
        <div className="flex max-w-56 min-w-0 items-start gap-3 text-left">
          <Avatar>
            {tenant.user?.imageUrl ? <AvatarImage src={tenant.user.imageUrl} alt="" /> : null}
            <AvatarFallback>{initials(tenant.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground" title={tenant.name}>
              {tenant.name}
            </p>
            <p className="truncate text-xs text-muted-foreground" title={tenant.email}>
              {tenant.email}
            </p>
            {tenant.contactNumber ? (
              <p className="truncate text-xs text-muted-foreground" title={tenant.contactNumber}>
                {tenant.contactNumber}
              </p>
            ) : null}
            {tenant.occupation ? (
              <p className="truncate text-xs text-muted-foreground" title={tenant.occupation}>
                {tenant.occupation}
              </p>
            ) : null}
          </div>
        </div>
      );
    },
  },
  {
    key: "room",
    header: "Room",
    wrap: true,
    cell: (viewing) =>
      viewing.room ? (
        <div className="min-w-0">
          <p className="text-foreground">{viewing.room.name}</p>
          <p className="text-xs text-muted-foreground">{formatMoney(viewing.room.monthlyRent)} a month</p>
        </div>
      ) : (
        "-"
      ),
  },
  {
    key: "preferredDate",
    header: "Asked for",
    cell: (viewing) => (
      <div>
        <p>{formatDate(viewing.preferredDate)}</p>
        <p className="text-xs text-muted-foreground">{TIME_SLOT_LABELS[viewing.timeSlot]}</p>
      </div>
    ),
  },
  {
    key: "scheduledDateTime",
    header: "Scheduled",
    cell: (viewing) => {
      if (!viewing.scheduledDateTime) return "-";
      const { text, note } = formatScheduled(viewing.scheduledDateTime, viewing.preferredDate);
      return (
        <span>
          {text}
          {note ? <span className="text-muted-foreground">, {note}</span> : null}
        </span>
      );
    },
  },
  { key: "status", header: "Status", cell: (viewing) => <StatusBadge status={viewing.status} /> },
  {
    key: "details",
    header: "Details",
    wrap: true,
    cell: (viewing) => {
      if (!viewing.message && !viewing.rejectionReason) return "-";
      return (
        <div className="space-y-0.5 text-sm">
          {viewing.message ? <p className="line-clamp-2">{viewing.message}</p> : null}
          {viewing.rejectionReason ? (
            <p className="line-clamp-2 text-muted-foreground">Reason: {viewing.rejectionReason}</p>
          ) : null}
        </div>
      );
    },
  },
];

export function OwnerViewingsList() {
  const { role } = useRole();
  const { page, limit, getParam } = useUrlState();
  const isManager = role === "PROPERTY_MANAGER";

  const rawStatus = getParam("status");
  const status = isStatus(rawStatus) ? rawStatus : "";
  const roomId = getParam("roomId");

  // Same room source as the maintenance and invoices pages.
  const rooms = useRooms(isManager, role !== null, { page: 1, limit: 100 });
  const query = useOwnerViewings({ page, limit, status, roomId }, role !== null);

  const roomOptions = (rooms.data?.rows ?? []).map((room) => ({
    value: room.id,
    label: `${room.name}, ${room.property.title}`,
  }));

  const filtered = Boolean(status || roomId);
  const empty: DataTableEmpty = filtered
    ? {
        icon: CalendarClock,
        title: "No viewing requests match these filters",
        description: "Try a different status or room, or show all requests.",
      }
    : {
        icon: CalendarClock,
        title: "No viewing requests for your rooms",
        description: isManager
          ? "Requests from tenants appear here for the properties assigned to you."
          : "When a tenant asks to see one of your rooms, the request appears here.",
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Viewings"
        description="Tenants who want to see your rooms. Approve a visit, say no with a reason, or mark it done."
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
          <ErrorState message={plainViewingError(query.error)} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={query.data?.rows ?? []}
          getRowId={(viewing) => viewing.id}
          isLoading={role === null || query.isPending}
          actions={(viewing) => <ViewingDecision viewing={viewing} />}
          empty={empty}
          caption="Viewing requests for your rooms"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
