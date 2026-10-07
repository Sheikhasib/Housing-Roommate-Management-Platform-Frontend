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
