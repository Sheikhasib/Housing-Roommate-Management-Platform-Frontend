import type { ApplicationRoom } from "@/types/application";
import type { ApplicantSummary } from "@/types/owner-application";
import type {
  ApplicationStatus,
  LeaseStatus,
  PaymentGateway,
  PaymentStatus,
} from "@/validation/enums";

/** The deposit payment of a lease's application. Only the fields the tenant screens read (backend spec 12). */
export interface LeaseDepositPayment {
  status: PaymentStatus;
  gateway: PaymentGateway;
  amount: string;
  paidAt?: string | null;
  refundTrxId?: string | null;
  refundAmount?: string | null;
  refundReason?: string | null;
  refundAt?: string | null;
}

export interface LeaseApplication {
  id: string;
  status: ApplicationStatus;
  payment?: LeaseDepositPayment | null;
}

/**
 * One item of `GET /lease/my-leases` and the body of `GET /lease/:leaseId` (backend spec 10).
 * The rows also carry `invoices[]` and `documents[]`; they are not typed here until those screens ship.
 * Money fields are strings.
 */
export interface TenantLease {
  id: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  depositAmount: string;
  terminationReason?: string | null;
  terminatedAt?: string | null;
  createdAt: string;
  room: ApplicationRoom;
  application?: LeaseApplication | null;
}

/** One item of `GET /lease/owner-leases` (backend spec 10). The room has no property here. */
export interface OwnerLeaseRow {
  id: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  tenantProfile: ApplicantSummary;
  room: { id: string; name: string; monthlyRent: string };
}

/**
 * Body of `GET /lease/:leaseId` as the owner or an assigned manager reads it. Manager responses
 * have no `application.payment` (spec 17 money isolation), so every payment read is optional.
 */
export interface OwnerLeaseDetail extends TenantLease {
  tenantProfile: ApplicantSummary;
}

/** `data` of `POST /lease/:leaseId/terminate`. */
export interface TerminateLeaseResult {
  lease: { id: string; status: LeaseStatus };
  refund: { status: "REFUNDED"; refundTrxId: string } | null;
}
