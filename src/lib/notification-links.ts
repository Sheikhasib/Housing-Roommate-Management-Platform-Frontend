import { ROLE_AREA } from "@/lib/permissions";
import type { NotificationRow } from "@/types/notification";
import type { NotificationType, Role } from "@/validation/enums";

type LinkTarget = Pick<NotificationRow, "type" | "data">;

/** A key counts only when it really arrives as a non-empty string. */
function readId(data: NotificationRow["data"], key: string): string | null {
  const value = data?.[key];
  return typeof value === "string" && value.trim() ? encodeURIComponent(value.trim()) : null;
}

// Only pages that exist in the app are listed. Roommates have no page yet.
const TENANT_BY_TYPE: Partial<Record<NotificationType, string>> = {
  APPLICATION: "/dashboard/applications",
  VIEWING: "/dashboard/viewings",
  LEASE: "/dashboard/leases",
  INVOICE: "/dashboard/invoices",
  PAYMENT: "/dashboard/payments",
  MAINTENANCE: "/dashboard/maintenance",
};

const OWNER_BY_TYPE: Partial<Record<NotificationType, string>> = {
  APPLICATION: "/owner/applications",
  VIEWING: "/owner/viewings",
  LEASE: "/owner/leases",
  INVOICE: "/owner/invoices",
  MAINTENANCE: "/owner/maintenance",
};

// Admins get a link only when the type name points to exactly one admin page.
const ADMIN_BY_TYPE: Partial<Record<NotificationType, string>> = {
  PAYMENT: "/admin/payments",
};

function tenantHref({ type, data }: LinkTarget): string | null {
  const applicationId = readId(data, "applicationId");
  if (applicationId) return `/dashboard/applications/${applicationId}`;
  const leaseId = readId(data, "leaseId");
  if (leaseId) return `/dashboard/leases/${leaseId}`;
  if (readId(data, "invoiceId")) return "/dashboard/invoices";
  return TENANT_BY_TYPE[type] ?? null;
}

function ownerHref({ type, data }: LinkTarget): string | null {
  const applicationId = readId(data, "applicationId");
  if (applicationId) return `/owner/applications/${applicationId}`;
  const leaseId = readId(data, "leaseId");
  if (leaseId) return `/owner/leases/${leaseId}`;
  const propertyId = readId(data, "propertyId");
  if (propertyId) return `/owner/properties/${propertyId}`;
  return OWNER_BY_TYPE[type] ?? null;
}

/** The page a notification opens for this role, or null when there is no reliable target. */
export function resolveNotificationHref(notification: LinkTarget, role: Role | null): string | null {
  if (!role) return null;
  switch (ROLE_AREA[role]) {
    case "tenant":
      return tenantHref(notification);
    case "owner":
      return ownerHref(notification);
    case "admin":
      return ADMIN_BY_TYPE[notification.type] ?? null;
  }
}
