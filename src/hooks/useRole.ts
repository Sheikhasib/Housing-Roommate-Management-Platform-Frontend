"use client";

import { useSession } from "@/hooks/useSession";
import { ROLE_AREA, type Area } from "@/lib/permissions";
import type { Role } from "@/validation/enums";

export function useRole(): { role: Role | null; area: Area | null } {
  const { role } = useSession();
  return { role, area: role ? ROLE_AREA[role] : null };
}
