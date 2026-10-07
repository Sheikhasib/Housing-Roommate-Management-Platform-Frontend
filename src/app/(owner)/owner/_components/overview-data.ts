import type { ManagerAnalytics, OwnerAnalytics } from "@/types/analytics";

/** What the page loaded. `stats: null` means the call failed (or the role is unknown). */
export type OverviewData =
  | { kind: "owner"; stats: OwnerAnalytics | null; errorMessage?: string }
  | { kind: "manager"; stats: ManagerAnalytics | null; errorMessage?: string }
  | { kind: "unknown"; stats: null; errorMessage: string };

/** The two kinds that have a snapshot to show. */
export type RoleOverviewData = Exclude<OverviewData, { kind: "unknown" }>;
