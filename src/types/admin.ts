import type { VerificationDocument } from "@/types/profile";
import type { Role, UserStatus, VerificationStatus } from "@/validation/enums";

/** Shape of `GET /admin/dashboard-stats` (docs/backend-specs/15-admin.md). */
export interface AdminDashboardStats {
  totalUsers: number;
  totalTenants: number;
  totalOwners: number;
  totalManagers: number;
  totalAdmins: number;
  blockedUsers: number;
  pendingOwnerVerifications: number;
  pendingTenantVerifications: number;
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
  totalApplications: number;
  pendingApplications: number;
  activeLeases: number;
  openMaintenanceRequests: number;
  /** Sum of PAID payments. Money can arrive as a Decimal string. */
  totalRevenue: number | string;
}

/** A server fetch that never throws: the page decides what to show for each part. */
export type LoadResult<T> = { ok: true; data: T } | { ok: false; message: string };

/** A row of `GET /admin/users` (password is never present). */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  imageUrl: string | null;
  createdAt: string;
  tenantProfile: { id: string; verificationStatus: VerificationStatus } | null;
  ownerProfile: { id: string; verificationStatus: VerificationStatus; companyName: string | null } | null;
  managerProfile: { id: string } | null;
}

/** The nested user on a verification row. */
export interface VerificationUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  imageUrl: string | null;
  createdAt: string;
}

/** A row of `GET /admin/tenant-verifications` (PENDING tenants with a document, oldest first). */
export interface TenantVerificationRow {
  id: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
  verificationDocUrl: string | null;
  createdAt: string;
  user: VerificationUser;
}

/** A row of `GET /owner/all-owners`. */
export interface OwnerVerificationRow {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  documents: VerificationDocument[] | null;
  createdAt: string;
  user: VerificationUser;
  _count: { properties: number };
}
