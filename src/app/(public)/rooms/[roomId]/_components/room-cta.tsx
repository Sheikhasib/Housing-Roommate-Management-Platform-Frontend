import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { getRoleHome } from "@/lib/permissions";
import type { RoomDetail } from "@/types/room";
import type { Role } from "@/validation/enums";
import { ApplyDialog } from "./apply-dialog";

interface RoomCtaProps {
  room: RoomDetail;
  role: Role | null;
  /** "bar" shows only the primary action (mobile bottom bar). */
  layout?: "card" | "bar";
}

/** Why a tenant cannot apply right now, or null when the room can take an application. */
function applyBlockedReason(room: RoomDetail): string | null {
  if (room.availableNow) return null;
  return room.nextAvailableDate
    ? `Available from ${formatDate(room.nextAvailableDate)}`
    : "Fully occupied";
}

/**
 * Guests go to login and come back here. A TENANT can apply while the room is available now;
 * the viewing button stays disabled until spec 07 exists. Other roles manage rooms from their dashboard.
 */
export function RoomCta({ room, role, layout = "card" }: RoomCtaProps) {
  const compact = layout === "bar";
  const roomId = room.id;

  if (role === null) {
    const loginHref = `/login?redirectTo=${encodeURIComponent(`/rooms/${roomId}`)}`;
    return (
      <div className={compact ? "" : "flex flex-col gap-2"}>
        <Button asChild size="lg" className="w-full">
          <Link href={loginHref}>Log in to apply</Link>
        </Button>
        {compact ? null : (
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href={loginHref}>Log in to request a viewing</Link>
          </Button>
        )}
      </div>
    );
  }

  if (role === "TENANT") {
    const blocked = applyBlockedReason(room);
    const reasonId = `apply-reason-${layout}`;
    return (
      <div className={compact ? "" : "flex flex-col gap-2"}>
        {blocked ? (
          <>
            <Button size="lg" className="w-full" disabled aria-describedby={reasonId}>
              Apply
            </Button>
            <p
              id={reasonId}
              className={compact ? "sr-only" : "text-center text-sm text-muted-foreground"}
            >
              {blocked}
            </p>
          </>
        ) : (
          <ApplyDialog room={room} className="w-full" />
        )}
        {compact ? null : (
          <Button size="lg" variant="outline" className="w-full" disabled>
            Request a viewing
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button asChild size="lg" className="w-full">
      <Link href={getRoleHome(role)}>
        <LayoutDashboard aria-hidden="true" />
        Manage in dashboard
      </Link>
    </Button>
  );
}
