import type {
  ApplicationStatus,
  InvoiceType,
  PaymentGateway,
  PaymentPurpose,
  PaymentStatus,
} from "@/validation/enums";

/** Enabled gateways from `GET /payment/gateways`: lowercase names, decided by the backend env. */
export interface GatewaysResponse {
  gateways: string[];
}

/**
 * A Payment row from `GET /payment/:paymentId` and `GET /payment/my-payments` (backend spec 12).
 * The list rows carry `application { id, status, room }` and `invoice { id, type, amount, dueDate }`;
 * the detail row carries the full application and invoice. Only the fields the screens read are typed.
 * Money fields are strings.
 */
export interface Payment {
  id: string;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  gateway: PaymentGateway;
  amount: string;
  currency: string;
  /** The subject key: the application id (DEPOSIT) or the invoice id (RENT, UTILITY). */
  merchantInvoiceNumber: string;
  /** The provider transaction id. */
  bKashTrxId: string | null;
  /** Reported by the provider as a string. */
  paidAt: string | null;
  createdAt: string;
  /** Refund fields: set only after a refund started or finished (deposit refunds). Money is a string. */
  refundTrxId?: string | null;
  refundAmount?: string | null;
  refundReason?: string | null;
  refundAt?: string | null;
  application?: {
    id: string;
    status?: ApplicationStatus;
    room?: { id: string; name: string };
  } | null;
  invoice?: {
    id: string;
    type?: InvoiceType;
    amount?: string;
    dueDate?: string;
  } | null;
}

/** `data` of `POST /application/:applicationId/pay-deposit` and `POST /invoice/:invoiceId/pay`. */
export interface PaymentSession {
  payment: Payment;
  paymentUrl: string;
}
