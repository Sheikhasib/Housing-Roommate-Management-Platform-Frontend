import { BedDouble, CalendarDays, Clock, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { formatDate, formatMoney } from "@/lib/format";
import type { RoomDetail } from "@/types/room";
import type { Role } from "@/validation/enums";
import { RoomCta } from "./room-cta";

interface BookingProps {
  room: RoomDetail;
  role: Role | null;
}

function nextAvailableText(room: RoomDetail): string {
  if (room.availableNow) return "Available now";
  if (room.nextAvailableDate) return `Available from ${formatDate(room.nextAvailableDate)}`;
  return "Fully occupied";
}

function Rent({ room, compact = false }: { room: RoomDetail; compact?: boolean }) {
  return (
    <p className="flex items-baseline gap-1 whitespace-nowrap">
      <span className={compact ? "text-xl font-semibold text-foreground" : "text-2xl font-semibold text-foreground"}>
        {formatMoney(room.monthlyRent)}
      </span>
      <span className="text-sm text-muted-foreground">/ month</span>
    </p>
  );
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm text-foreground">
      <span className="text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

/** Desktop: sticky card in the right column. */
export function RoomBookingCard({ room, role }: BookingProps) {
  const months = room.minLeaseMonths === 1 ? "month" : "months";
  return (
    <aside aria-label="Booking" className="hidden lg:block">
      <div className="sticky top-24 space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <Rent room={room} />
        <ul className="space-y-3">
          <Fact icon={<Wallet className="size-4" />}>
            Booking deposit {formatMoney(room.bookingDeposit)}
          </Fact>
          <Fact icon={<Clock className="size-4" />}>
            Minimum lease {room.minLeaseMonths} {months}
          </Fact>
          <Fact icon={<BedDouble className="size-4" />}>
            {room.availableBeds} of {room.bedCount} {room.bedCount === 1 ? "bed" : "beds"} free
          </Fact>
          <Fact icon={<CalendarDays className="size-4" />}>{nextAvailableText(room)}</Fact>
        </ul>
        <RoomCta roomId={room.id} role={role} />
      </div>
    </aside>
  );
}

/** Mobile: bar stuck to the bottom of the viewport. It scrolls away with the page end, so the footer stays visible. */
export function RoomBookingBar({ room, role }: BookingProps) {
  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-card lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <Rent room={room} compact />
          <p className="truncate text-xs text-muted-foreground">{nextAvailableText(room)}</p>
        </div>
        <div className="shrink-0">
          <RoomCta roomId={room.id} role={role} layout="bar" />
        </div>
      </div>
    </div>
  );
}
