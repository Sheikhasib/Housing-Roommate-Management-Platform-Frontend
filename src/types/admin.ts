import type { VerificationDocument } from "@/types/profile";
import type {
  PaymentGateway,
  PaymentPurpose,
  PaymentStatus,
  PropertyType,
  Role,
  UserStatus,
  VerificationStatus,
} from "@/validation/enums";

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

/** A row of `GET /property/all` (docs/backend-specs/05-property.md). */
export interface AdminPropertyRow {
  id: string;
  title: string;
  type: PropertyType;
  city: string;
  area: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string; verificationStatus: VerificationStatus };
  _count: { rooms: number };
}

/** The tenant on a payment, reached through the application or the invoice's lease. */
export interface PaymentTenant {
  id: string;
  name: string;
  email: string;
}

/** A row of `GET /payment/all-payments` (docs/backend-specs/12-payment.md). Money arrives as a Decimal string. */
export interface AdminPaymentRow {
  id: string;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  gateway: PaymentGateway;
  amount: string | number;
  currency: string;
  createdAt: string;
  application: { id: string; tenantProfile: PaymentTenant } | null;
  invoice: { id: string; type: string; lease: { tenantProfile: PaymentTenant } | null } | null;
}

/**
 * A row of `GET /admin/payments/pending-refunds`. The backend spec lists the tenant profile and lease
 * status as included but not their field names, so only the Payment columns are typed here.
 */
export interface PendingRefundRow {
  id: string;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  gateway: PaymentGateway;
  amount: string | number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/** A row of `GET /admin/payments/pending-settlements`: a stale PROCESSING payment. */
export type PendingSettlementRow = PendingRefundRow;

/** A row of `GET /admin/audit-logs`. `before` and `after` are free-form JSON. */
export interface AuditLogRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
