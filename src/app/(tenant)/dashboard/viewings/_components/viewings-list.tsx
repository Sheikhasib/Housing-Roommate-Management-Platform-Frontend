"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate } from "@/lib/format";
import { formatScheduled, TIME_SLOT_LABELS } from "@/lib/viewing-labels";
import type { TenantViewing } from "@/types/viewing";
import { VIEWING_STATUSES } from "@/validation/enums";
import { useMyViewings } from "../_hooks/use-viewing-queries";
import { CancelViewing } from "./cancel-viewing";

const STATUS_OPTIONS = VIEWING_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

const COLUMNS: DataTableColumn<TenantViewing>[] = [
  {
    key: "room",
    header: "Room",
    cell: (viewing) => (
      <div className="min-w-0">
        <Link
          href={`/rooms/${viewing.room.id}`}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {viewing.room.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {viewing.room.property.title}, {viewing.room.property.city}
        </p>
      </div>
    ),
  },
  { key: "preferredDate", header: "Preferred day", cell: (v) => formatDate(v.preferredDate) },
  { key: "timeSlot", header: "Time of day", cell: (v) => TIME_SLOT_LABELS[v.timeSlot] },
  { key: "status", header: "Status", cell: (v) => <StatusBadge status={v.status} /> },
  {
    key: "details",
    header: "Details",
    cell: (v) => {
      if (!v.scheduledDateTime && !v.rejectionReason) return "-";
      const scheduled = v.scheduledDateTime ? formatScheduled(v.scheduledDateTime, v.preferredDate) : null;
      return (
        <div className="space-y-0.5 text-sm">
          {scheduled ? (
            <p>
              Scheduled for {scheduled.text}
              {scheduled.note ? <span className="text-muted-foreground">, {scheduled.note}</span> : null}
            </p>
          ) : null}
          {v.rejectionReason ? (
            <p className="text-muted-foreground">Reason: {v.rejectionReason}</p>
          ) : null}
        </div>
      );
    },
  },
];

export function ViewingsList() {
  const { page, limit, getParam } = useUrlState();
  const status = getParam("status");
  const query = useMyViewings({ page, limit, status });

  const rows = query.data?.rows ?? [];

  const empty: DataTableEmpty = status
    ? {
        icon: CalendarClock,
        title: "No viewing requests with this status",
        description: "Try a different status or show all requests.",
      }
    : {
        icon: CalendarClock,
        title: "You have no viewing requests yet",
        description: "Find a room you like and ask to see it from its page.",
        action: (
          <Button asChild>
            <Link href="/rooms">Browse rooms</Link>
          </Button>
        ),
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My viewing requests"
        description="Ask to see a room before you apply. The owner approves a time or explains why not."
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
          getRowId={(viewing) => viewing.id}
          isLoading={query.isPending}
          actions={(viewing) => (
            <CancelViewing
              viewingId={viewing.id}
              roomName={viewing.room.name}
              status={viewing.status}
            />
          )}
          empty={empty}
          caption="My viewing requests"
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
