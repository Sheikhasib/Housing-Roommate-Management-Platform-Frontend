import type { Role } from "@/validation/enums";

/**
 * Single source of truth for what each role may do in the UI (spec 17).
 * The UI hides what a role cannot use; the backend stays the real authority.
 */
const OWNER_SIDE = ["OWNER", "PROPERTY_MANAGER"] as const satisfies readonly Role[];
const OWNER_ONLY = ["OWNER"] as const satisfies readonly Role[];

export const PERMISSIONS = {
  // Shared by owner and manager
  "viewings.decide": OWNER_SIDE,
  "applications.review": OWNER_SIDE,
  "maintenance.manage": OWNER_SIDE,
  "rooms.edit": OWNER_SIDE,
  "rooms.availabilityBoard": OWNER_SIDE,
  "properties.edit": OWNER_SIDE,
  "managers.view": OWNER_SIDE,
  "invoices.manage": OWNER_SIDE,
  "leases.view": OWNER_SIDE,
  // Owner only
  "properties.createDelete": OWNER_ONLY,
  "rooms.createDelete": OWNER_ONLY,
  "managers.assign": OWNER_ONLY,
  "leases.terminate": OWNER_ONLY,
  "leases.documents": OWNER_ONLY,
  "payments.view": OWNER_ONLY,
  "payments.refund": OWNER_ONLY,
  "ownerVerification.manage": OWNER_ONLY,
  // Analytics: each side sees its own version
  "analytics.owner": OWNER_ONLY,
  "analytics.manager": ["PROPERTY_MANAGER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function hasRole(role: Role | null | undefined, roles: readonly Role[]): boolean {
  return role ? roles.includes(role) : false;
}

export type Area = "admin" | "owner" | "tenant";

export const ROLE_AREA: Record<Role, Area> = {
  SUPER_ADMIN: "admin",
  ADMIN: "admin",
  OWNER: "owner",
  PROPERTY_MANAGER: "owner",
  TENANT: "tenant",
};

export const AREA_HOME: Record<Area, string> = {
  admin: "/admin",
  owner: "/owner",
  tenant: "/dashboard",
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  OWNER: "Owner",
  PROPERTY_MANAGER: "Manager",
  TENANT: "Tenant",
};

export function getRoleHome(role: Role): string {
  return AREA_HOME[ROLE_AREA[role]];
}

export function getProfileHref(role: Role): string {
  return `${getRoleHome(role)}/profile`;
}
