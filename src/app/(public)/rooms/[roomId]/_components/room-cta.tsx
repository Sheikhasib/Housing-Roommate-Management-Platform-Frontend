import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getRoleHome } from "@/lib/permissions";
import type { Role } from "@/validation/enums";

interface RoomCtaProps {
  roomId: string;
  role: Role | null;
  /** "bar" shows only the primary action (mobile bottom bar). */
  layout?: "card" | "bar";
}

/**
 * Guests go to login and come back here. TENANT buttons stay disabled until the apply and
 * viewing dialogs of specs 08 and 07 exist. Other roles manage rooms from their dashboard.
 */
export function RoomCta({ roomId, role, layout = "card" }: RoomCtaProps) {
  const compact = layout === "bar";

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
    return (
      <div className={compact ? "" : "flex flex-col gap-2"}>
        <Button size="lg" className="w-full" disabled>
          Apply
        </Button>
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
