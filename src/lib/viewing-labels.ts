import { ApiError } from "@/lib/api/apiError";
import type { ViewingTimeSlot } from "@/validation/enums";

export const TIME_SLOT_LABELS: Record<ViewingTimeSlot, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

const GENERIC_ERROR = "Something went wrong. Please try again.";
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
