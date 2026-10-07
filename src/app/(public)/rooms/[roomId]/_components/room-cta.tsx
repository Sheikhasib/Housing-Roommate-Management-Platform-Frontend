import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { getRoleHome } from "@/lib/permissions";
import type { RoomDetail } from "@/types/room";
import type { Role } from "@/validation/enums";
import { ApplyDialog } from "./apply-dialog";
import { ViewingRequestDialog } from "./viewing-request-dialog";

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

/** A viewing can be requested even when the room is full; only an unpublished room blocks it. */
function viewingBlockedReason(room: RoomDetail): string | null {
  return room.isPublished === false ? "This room is not open for viewings right now" : null;
}

/**
 * Guests go to login and come back here. A TENANT can apply while the room is available now and
 * can request a viewing whenever the room is published. Other roles manage rooms from their dashboard.
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
    const viewingReasonId = `viewing-reason-${layout}`;
    const viewingBlocked = viewingBlockedReason(room);
    const buttonClass = compact ? "h-11 px-4" : "w-full";
    const viewingButton = viewingBlocked ? (
      <>
        <Button
          size="lg"
          variant="outline"
          className={buttonClass}
          disabled
          aria-describedby={viewingReasonId}
        >
          {compact ? "Viewing" : "Request a viewing"}
        </Button>
        <p
          id={viewingReasonId}
          className={compact ? "sr-only" : "text-center text-sm text-muted-foreground"}
        >
          {viewingBlocked}
        </p>
      </>
    ) : (
      <ViewingRequestDialog
        room={room}
        className={buttonClass}
        label={compact ? "Viewing" : undefined}
      />
    );
    return (
      <div className={compact ? "flex items-center gap-2" : "flex flex-col gap-2"}>
        {compact ? viewingButton : null}
        {blocked ? (
          <>
            <Button size="lg" className={buttonClass} disabled aria-describedby={reasonId}>
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
          <ApplyDialog room={room} className={buttonClass} />
        )}
        {compact ? null : viewingButton}
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
