import type { Payment } from "@/types/payment";
import type { InvoiceStatus, InvoiceType } from "@/validation/enums";

/**
 * One item of `GET /invoice/room/:roomId` (backend spec 11). The backend adds the payment for owners
 * and removes it for managers (spec 17), and no screen here reads it, so it is not typed.
 * Money fields are strings.
 */
export interface OwnerInvoiceRow {
  id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  amount: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  description: string | null;
  lease: {
    id: string;
    tenantProfile: { id: string; name: string; email: string };
  };
}

/**
 * One item of `GET /invoice/my-invoices` (backend spec 11): the lease, the room with its property,
 * and the full payment row or null. Money fields are strings.
 */
export interface TenantInvoice {
  id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  amount: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  description: string | null;
  lease: { id: string; monthlyRent: string };
  room: { id: string; name: string; property: { id: string; title: string; city: string } };
  payment: Payment | null;
}
