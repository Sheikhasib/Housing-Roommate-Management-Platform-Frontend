import { formatDate, formatMoney } from "@/lib/format";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { RoomDetail } from "@/types/room";

function availableFromLabel(room: RoomDetail): string {
  if (room.availableNow) return "Now";
  if (room.nextAvailableDate) return formatDate(room.nextAvailableDate);
  return "Not scheduled yet";
}

export function RoomKeyInfo({ room }: { room: RoomDetail }) {
  const rows: Array<[string, string]> = [
    ["Room type", ROOM_TYPE_LABELS[room.type]],
    ["Size", room.sizeSqft ? `${room.sizeSqft} sq ft` : "Not listed"],
    ["Beds in total", String(room.bedCount)],
    ["Beds free", String(room.availableBeds)],
    ["Monthly rent", formatMoney(room.monthlyRent)],
    ["Booking deposit", formatMoney(room.bookingDeposit)],
    ["Minimum lease", `${room.minLeaseMonths} ${room.minLeaseMonths === 1 ? "month" : "months"}`],
    ["Furnished", room.isFurnished ? "Yes" : "No"],
    ["Available from", availableFromLabel(room)],
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-base">
        <caption className="sr-only">Key information about {room.name}</caption>
        <tbody className="divide-y divide-border">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row" className="w-1/2 px-4 py-3 text-sm font-medium text-muted-foreground">
                {label}
              </th>
              <td className="px-4 py-3 font-medium text-foreground">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
