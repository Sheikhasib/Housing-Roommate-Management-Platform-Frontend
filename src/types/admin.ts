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
