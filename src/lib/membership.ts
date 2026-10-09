import { formatDate } from "@/lib/format";
import type { MembershipRow } from "@/types/roommate";

const SYSTEM_REMOVER = "system-cron";
const AUTOMATIC_REASONS = ["lease completed", "lease terminated"];

function onDate(value: string | null): string {
  return value ? ` on ${formatDate(value)}` : "";
}

/**
 * One plain sentence about what happened to a membership, for the Details column and the detail page.
 * `myUserId` is the signed-in user id (compared with `removedBy`); null while the session loads.
 */
export function membershipDetails(row: MembershipRow, myUserId: string | null): string {
  const isHolder = row.role === "HOLDER";

  switch (row.status) {
    case "ACTIVE":
      return `Joined${onDate(row.joinedAt)}`;
    case "REJECTED":
      return `Declined${onDate(row.respondedAt)}`;
    case "PENDING": {
      const message = row.message?.replace(/\s+/g, " ").trim();
      if (message) return message;
      return isHolder ? "Waiting for an answer" : "Waiting for your answer";
    }
    case "REMOVED": {
      const reason = row.removalReason?.trim() ?? "";
      const lowerReason = reason.toLowerCase();
      const date = onDate(row.removedAt);
      const byMe = myUserId !== null && row.removedBy === myUserId;

      if (row.removedBy === SYSTEM_REMOVER || AUTOMATIC_REASONS.includes(lowerReason)) {
        return reason ? `Ended automatically: ${reason}` : "Ended automatically";
      }
      if (lowerReason === "left") {
        if (byMe) return `You left${date}`;
        if (myUserId === null) return `The roommate left${date}`;
        const other = isHolder ? row.member.name : row.holder.name;
        return `${other} left${date}`;
      }
      const suffix = reason ? ` · Reason: ${reason}` : "";
      if (isHolder) {
        return byMe || myUserId === null
          ? `You removed ${row.member.name}${date}${suffix}`
          : `${row.member.name} was removed${date}${suffix}`;
      }
      return `${row.holder.name} removed you${date}${suffix}`;
    }
  }
}
