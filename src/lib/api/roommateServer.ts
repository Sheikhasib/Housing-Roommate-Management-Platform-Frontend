import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { MembershipRow } from "@/types/roommate";

/**
 * The backend has no single-membership read, so the row is found in my memberships.
 * limit=100 is the same window the Memberships tab uses. Null when the id is not one of mine.
 */
export async function getMembershipForTenant(membershipId: string): Promise<MembershipRow | null> {
  const response = await serverApi<ApiSuccess<MembershipRow[]>>("/roommate/memberships/my", {
    query: { page: 1, limit: 100 },
  });
  return response.data.find((row) => row.id === membershipId) ?? null;
}
