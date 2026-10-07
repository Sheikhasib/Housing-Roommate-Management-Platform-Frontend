"use client";

import { Receipt } from "lucide-react";

import { Can } from "@/components/shared/can";
import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { useRole } from "@/hooks/useRole";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate, formatMoney } from "@/lib/format";
import type { OwnerInvoiceRow } from "@/types/invoice";
import { INVOICE_STATUSES, INVOICE_TYPES } from "@/validation/enums";
import { useRooms } from "../../rooms/_hooks/use-room-queries";
import { useRoomInvoices } from "../_hooks/use-owner-invoice-queries";
import { CreateUtilityBill } from "./create-utility-bill";

const toOptions = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase() }));

const STATUS_OPTIONS = toOptions(INVOICE_STATUSES);
const TYPE_OPTIONS = toOptions(INVOICE_TYPES);

const COLUMNS: DataTableColumn<OwnerInvoiceRow>[] = [
  {
    key: "tenant",
    header: "Tenant",
    cell: (invoice) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{invoice.lease.tenantProfile.name}</p>
        <p className="truncate text-xs text-muted-foreground">{invoice.lease.tenantProfile.email}</p>
      </div>
    ),
  },
  { key: "type", header: "Type", cell: (invoice) => <StatusBadge status={invoice.type} /> },
  { key: "amount", header: "Amount", cell: (invoice) => formatMoney(invoice.amount) },
  {
    key: "period",
    header: "Period",
    cell: (invoice) => `${formatDate(invoice.periodStart)} to ${formatDate(invoice.periodEnd)}`,
  },
  { key: "dueDate", header: "Due date", cell: (invoice) => formatDate(invoice.dueDate) },
  { key: "status", header: "Status", cell: (invoice) => <StatusBadge status={invoice.status} /> },
];

export function OwnerInvoicesList() {
  const { role } = useRole();
  const { page, limit, getParam } = useUrlState();
  const isManager = role === "PROPERTY_MANAGER";

  const roomId = getParam("roomId");
  const status = getParam("status");
  const type = getParam("type");

  // Same room source as the rooms page: the owner list, or the rooms of a manager's properties.
  const rooms = useRooms(isManager, role !== null, { page: 1, limit: 100 });
  const query = useRoomInvoices({ roomId, page, limit, status, type }, role !== null);

  const roomOptions = (rooms.data?.rows ?? []).map((room) => ({
    value: room.id,
    label: `${room.name}, ${room.property.title}`,
  }));
  const noRooms = !rooms.isPending && roomOptions.length === 0;

  const rows = query.data?.rows ?? [];
  const loading = role === null || (Boolean(roomId) && query.isPending);

  let empty: DataTableEmpty;
  if (!roomId) {
    empty = noRooms
      ? {
          icon: Receipt,
          title: "No rooms yet",
          description: isManager
            ? "Rooms appear here when an owner assigns you a property."
            : "Add a room first. Invoices are listed per room.",
        }
      : {
          icon: Receipt,
          title: "Pick a room to see its invoices",
          description: "Choose a room above to list its rent and utility invoices.",
        };
  } else if (status || type) {
    empty = {
      icon: Receipt,
      title: "No invoices match these filters",
      description: "Try a different status or type.",
    };
  } else {
    empty = {
      icon: Receipt,
      title: "No invoices for this room",
      description: "Rent invoices start from the second month of a lease. Create a utility bill to bill the tenants now.",
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Rent and utility invoices for one room at a time."
        action={
          <Can permission="invoices.manage">
            {roomOptions.length > 0 ? (
              <CreateUtilityBill rooms={roomOptions} selectedRoomId={roomId} />
            ) : null}
          </Can>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <FilterSelect
          param="roomId"
          label="Room"
          placeholder="Pick a room"
          options={roomOptions}
          className="sm:w-72"
        />
        <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
        <FilterSelect param="type" label="Type" allLabel="All types" options={TYPE_OPTIONS} />
      </div>

      {roomId && query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={roomId ? rows : []}
          getRowId={(invoice) => invoice.id}
          isLoading={loading}
          empty={empty}
          caption="Invoices for the chosen room"
          footer={roomId && query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
