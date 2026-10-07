/** Shape of `GET /analytics/tenant-analytics` (docs/backend-specs/16-analytics.md). A live snapshot. */
export interface TenantAnalytics {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  activeLeases: number;
  /** Leases that are COMPLETED or TERMINATED. */
  completedLeases: number;
  /** Sum of PAID payments. Money can arrive as a Decimal string. */
  totalSpent: number | string;
  /** Count of UNPAID invoices. */
  outstandingInvoices: number;
  /** Sum of the UNPAID invoice amounts. */
  totalDue: number | string;
  openMaintenance: number;
  roommateCount: number;
}

/** Shape of `GET /analytics/owner-analytics`. A live snapshot of the owner's portfolio. */
export interface OwnerAnalytics {
  totalProperties: number;
  totalRooms: number;
  publishedRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  /** Whole percent, 0 when there are no beds. */
  occupancyRate: number;
  activeLeases: number;
  pendingApplications: number;
  pendingViewings: number;
  openMaintenance: number;
  /** Sum of PAID payments. Money can arrive as a Decimal string. */
  totalEarnings: number | string;
  /** Sum of UNPAID RENT invoices. Money can arrive as a Decimal string. */
  outstandingRent: number | string;
}

/** Shape of `GET /analytics/manager-analytics`. Assigned properties only, no money fields. */
export interface ManagerAnalytics {
  managedProperties: number;
  totalRooms: number;
  publishedRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  /** Whole percent, 0 when there are no beds. */
  occupancyRate: number;
  activeLeases: number;
  pendingApplications: number;
  pendingViewings: number;
  openMaintenance: number;
  /** Count of UNPAID utility invoices (a count, not money). */
  pendingUtilityInvoices: number;
}
