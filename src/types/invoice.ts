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
