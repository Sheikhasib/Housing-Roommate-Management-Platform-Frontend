import { ApiError } from "@/lib/api/apiError";
import { formatDate, formatDateTime } from "@/lib/format";
import type { ViewingTimeSlot } from "@/validation/enums";

export const TIME_SLOT_LABELS: Record<ViewingTimeSlot, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

export interface ScheduledLabel {
  /** The date, or the date and time. */
  text: string;
  /** Set when no time was chosen; show it in the muted text style after `text`. */
  note: string | null;
}

/**
 * The scheduled moment of a viewing. When the owner approved without picking a time, the server
 * stores the preferred date itself, so only the date is shown with a "time to be agreed" note.
 */
export function formatScheduled(scheduledDateTime: string, preferredDate: string | null): ScheduledLabel {
  const scheduled = new Date(scheduledDateTime).getTime();
  const preferred = preferredDate ? new Date(preferredDate).getTime() : Number.NaN;
  if (scheduled === preferred) {
    return { text: formatDate(scheduledDateTime), note: "time to be agreed" };
  }
  return { text: formatDateTime(scheduledDateTime), note: null };
}

const GENERIC_ERROR ="Something went wrong. Please try again.";
const SERVICE_DOWN_ERROR = "We could not reach the service right now. Please try again in a moment.";
const TECHNICAL_MESSAGE =
  /token|duplicate key|prisma|econn|etimedout|timeout|unexpected|internal|undefined|null|stack|exception|failed to/i;

/**
 * The text to show for a failed viewing call. Messages written for people (400, 403, 404, 409)
 * come through as they are. A server failure, or a message that reads like a technical error,
 * becomes one plain sentence.
 */
export function plainViewingError(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_ERROR;
  const message = (error.errors[0]?.message || error.message || "").trim();
  if (error.status >= 500) return SERVICE_DOWN_ERROR;
  if (!message || message === "Something went wrong") return GENERIC_ERROR;
  if (TECHNICAL_MESSAGE.test(message) && error.status !== 403 && error.status !== 409) {
    return GENERIC_ERROR;
  }
  return message;
}
