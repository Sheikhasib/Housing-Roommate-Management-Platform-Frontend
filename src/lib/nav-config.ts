import {
  Building2,
  ClipboardList,
  CalendarClock,
  CreditCard,
  DoorOpen,
  FileText,
  LayoutDashboard,
  Receipt,
  ScrollText,
  ShieldCheck,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { ROLE_AREA, type Area } from "@/lib/permissions";
import type { Role } from "@/validation/enums";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: readonly Role[];
  /** Match the path exactly (used by each area's Overview item). */
  end?: boolean;
}

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"] as const satisfies readonly Role[];
const OWNER_SIDE = ["OWNER", "PROPERTY_MANAGER"] as const satisfies readonly Role[];
const TENANT_ROLES = ["TENANT"] as const satisfies readonly Role[];

/**
 * Single source of truth for dashboard navigation (spec 01-foundation).
 */
export const NAV_CONFIG: Record<Area, readonly NavItem[]> = {
  tenant: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: TENANT_ROLES, end: true },
    { label: "Applications", href: "/dashboard/applications", icon: FileText, roles: TENANT_ROLES },
    { label: "Viewings", href: "/dashboard/viewings", icon: CalendarClock, roles: TENANT_ROLES },
    { label: "Leases", href: "/dashboard/leases", icon: ScrollText, roles: TENANT_ROLES },
    { label: "Invoices", href: "/dashboard/invoices", icon: Receipt, roles: TENANT_ROLES },
    { label: "Payments", href: "/dashboard/payments", icon: CreditCard, roles: TENANT_ROLES },
    { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench, roles: TENANT_ROLES },
    { label: "Roommates", href: "/dashboard/roommates", icon: Users, roles: TENANT_ROLES },
    { label: "Profile", href: "/dashboard/profile", icon: User, roles: TENANT_ROLES },
  ],
  owner: [
    { label: "Overview", href: "/owner", icon: LayoutDashboard, roles: OWNER_SIDE, end: true },
    { label: "Properties", href: "/owner/properties", icon: Building2, roles: OWNER_SIDE },
    { label: "Rooms", href: "/owner/rooms", icon: DoorOpen, roles: OWNER_SIDE },
    { label: "Viewings", href: "/owner/viewings", icon: CalendarClock, roles: OWNER_SIDE },
    { label: "Applications", href: "/owner/applications", icon: FileText, roles: OWNER_SIDE },
    { label: "Leases", href: "/owner/leases", icon: ScrollText, roles: OWNER_SIDE },
    { label: "Invoices", href: "/owner/invoices", icon: Receipt, roles: OWNER_SIDE },
    { label: "Maintenance", href: "/owner/maintenance", icon: Wrench, roles: OWNER_SIDE },
    { label: "Profile", href: "/owner/profile", icon: User, roles: OWNER_SIDE },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, roles: ADMIN_ROLES, end: true },
    { label: "Users", href: "/admin/users", icon: Users, roles: ADMIN_ROLES },
    { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck, roles: ADMIN_ROLES },
    { label: "Properties", href: "/admin/properties", icon: Building2, roles: ADMIN_ROLES },
    { label: "Payments", href: "/admin/payments", icon: CreditCard, roles: ADMIN_ROLES },
    { label: "Audit logs", href: "/admin/audit-logs", icon: ClipboardList, roles: ADMIN_ROLES },
    { label: "Profile", href: "/admin/profile", icon: User, roles: ADMIN_ROLES },
  ],
};

export const AREA_LABELS: Record<Area, string> = {
  admin: "Admin",
  owner: "Owner",
  tenant: "Tenant",
};

/** Items the role may see. Without a role (session not ready) the whole area list is shown. */
export function getNavItems(area: Area, role: Role | null): readonly NavItem[] {
  const items = NAV_CONFIG[area];
  if (!role || ROLE_AREA[role] !== area) return items;
  return items.filter((item) => item.roles.includes(role));
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.end) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Title for the top bar: the label of the longest matching nav item. */
export function getPageTitle(items: readonly NavItem[], pathname: string): string {
  const match = items
    .filter((item) => isNavItemActive(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Dashboard";
}
