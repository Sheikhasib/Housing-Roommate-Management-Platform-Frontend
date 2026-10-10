"use client";

import Link from "next/link";
import { DoorOpen, Plus } from "lucide-react";

import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRole } from "@/hooks/useRole";
import { useUrlState } from "@/hooks/useUrlState";
import { formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { RoomRow } from "@/types/owner-room";
import { ROOM_STATUSES } from "@/validation/enums";
import { useRooms, usePropertyPicker } from "../_hooks/use-room-queries";
import { PublishSwitch } from "./publish-switch";

const STATUS_OPTIONS = ROOM_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

const PUBLISHED_OPTIONS = [
  { value: "true", label: "Published" },
  { value: "false", label: "Draft" },
] as const;

const COLUMNS: DataTableColumn<RoomRow>[] = [
  {
    key: "name",
    header: "Room",
    wrap: true,
    cell: (room) => (
      <div className="min-w-0">
        <Link
          href={`/owner/rooms/${room.id}`}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {room.name}
        </Link>
        <p className="text-xs text-muted-foreground">{ROOM_TYPE_LABELS[room.type]}</p>
      </div>
    ),
  },
  {
    key: "property",
    header: "Property",
    wrap: true,
    cell: (room) => (
      <div className="min-w-0">
        <p>{room.property.title}</p>
        {room.property.city ? (
          <p className="text-xs text-muted-foreground">{room.property.city}</p>
        ) : null}
      </div>
    ),
  },
  { key: "status", header: "Status", cell: (room) => <StatusBadge status={room.status} /> },
  { key: "monthlyRent", header: "Rent", cell: (room) => formatMoney(room.monthlyRent) },
  {
    key: "beds",
    header: "Beds",
    cell: (room) => (
      <div className="flex min-w-24 flex-col gap-1">
        <span className="text-sm">
          {room.occupiedBeds} of {room.bedCount} occupied
        </span>
        <Progress
          value={room.bedCount > 0 ? (room.occupiedBeds / room.bedCount) * 100 : 0}
          aria-label={`${room.occupiedBeds} of ${room.bedCount} beds occupied`}
        />
      </div>
    ),
  },
  {
    key: "isPublished",
    header: "Published",
    cell: (room) => (
      <PublishSwitch roomId={room.id} roomName={room.name} isPublished={room.isPublished} />
    ),
  },
];

function RowActions({ room }: { room: RoomRow }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/owner/rooms/${room.id}`} aria-label={`Manage ${room.name}`}>
        Manage
      </Link>
    </Button>
  );
}

function CreateRoomButton() {
  return (
    <Button asChild>
      <Link href="/owner/rooms/new">
        <Plus aria-hidden="true" />
        Create room
      </Link>
    </Button>
  );
}

export function RoomsList() {
  const { role } = useRole();
  const { page, limit, getParam } = useUrlState();
  const isManager = role === "PROPERTY_MANAGER";
  const canCreate = hasPermission(role, "rooms.createDelete");

  const status = getParam("status");
  const isPublished = getParam("isPublished");
  const propertyId = getParam("propertyId");
  const filtered = Boolean(status || isPublished || propertyId);

  const query = useRooms(isManager, role !== null, { page, limit, status, isPublished, propertyId });
  const properties = usePropertyPicker(isManager, role !== null);

  const rows = query.data?.rows ?? [];
  const loading = role === null || query.isPending;
  const propertyOptions = (properties.data?.rows ?? []).map((property) => ({
    value: property.id,
    label: property.title,
  }));

  const empty: DataTableEmpty = filtered
    ? {
        icon: DoorOpen,
        title: "No rooms match these filters",
        description: "Try a different status, publish state or property.",
      }
    : isManager
      ? {
          icon: DoorOpen,
          title: "No rooms in your assigned properties yet",
          description: "Rooms appear here once an owner adds them to a property assigned to you.",
        }
      : {
          icon: DoorOpen,
          title: "No rooms yet",
          description:
            properties.data && properties.data.rows.length === 0
              ? "Create a property first, then add rooms to it."
              : "Create your first room to start taking applications.",
          action:
            properties.data && properties.data.rows.length === 0 ? (
              <Button asChild>
                <Link href="/owner/properties/new">Create property</Link>
              </Button>
            ) : (
              <CreateRoomButton />
            ),
        };

  // A manager's rooms are grouped by property, in the order the backend returned the properties.
  const groups = isManager
    ? rows.reduce<{ id: string; title: string; rooms: RoomRow[] }[]>((acc, room) => {
        const group = acc.find((item) => item.id === room.property.id);
        if (group) group.rooms.push(room);
        else acc.push({ id: room.property.id, title: room.property.title, rooms: [room] });
        return acc;
      }, [])
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms"
        description={
          isManager
            ? "The rooms of the properties an owner has assigned to you."
            : "Every room you list. Turn the switch to publish or hide a room."
        }
        action={canCreate ? <CreateRoomButton /> : null}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <FilterSelect
          param="status"
          label="Status"
          allLabel="All statuses"
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          param="isPublished"
          label="Published"
          allLabel="All rooms"
          options={PUBLISHED_OPTIONS}
        />
        <FilterSelect
          param="propertyId"
          label="Property"
          allLabel="All properties"
          options={propertyOptions}
          className="sm:w-56"
        />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : isManager && !loading && groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.id} className="space-y-3" aria-labelledby={`property-${group.id}`}>
              <h2 id={`property-${group.id}`} className="text-lg font-semibold text-foreground">
                {group.title}
              </h2>
              <DataTable
                columns={COLUMNS}
                rows={group.rooms}
                getRowId={(room) => room.id}
                actions={(room) => <RowActions room={room} />}
                empty={empty}
                caption={`Rooms in ${group.title}`}
              />
            </section>
          ))}
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          getRowId={(room) => room.id}
          isLoading={loading}
          actions={(room) => <RowActions room={room} />}
          empty={empty}
          caption="Rooms"
          footer={!isManager && query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
