import { Badge } from "@/components/ui/badge";

type StatusVariant = "success" | "warning" | "info" | "danger" | "neutral";

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  APPROVED: "success",
  PAID: "success",
  ACTIVE: "success",
  AVAILABLE: "success",
  COMPLETED: "success",
  RESOLVED: "success",
  ACCEPTED: "success",
  PENDING: "warning",
  PROCESSING: "warning",
  UNPAID: "warning",
  RESERVED: "warning",
  REFUND_PENDING: "warning",
  ASSIGNED: "info",
  IN_PROGRESS: "info",
  REJECTED: "danger",
  FAILED: "danger",
  BLOCKED: "danger",
  TERMINATED: "danger",
  OCCUPIED: "danger",
  URGENT: "danger",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  CLOSED: "neutral",
  DECLINED: "neutral",
  REMOVED: "neutral",
  MAINTENANCE: "neutral",
  REFUNDED: "neutral",
};

/** "IN_PROGRESS" becomes "In progress". */
function toLabel(status: string): string {
  const text = status.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANTS[status.toUpperCase()] ?? "neutral";
  return (
    <Badge variant={variant} className={className}>
      {toLabel(status)}
    </Badge>
  );
}
