# 10: Invoices, payments and payment return

Priority: P0 · Backend specs: 11 (invoice), 12 (payment) · Depends on: 01-foundation, 04-profile, 08-applications, 09-leases

## Goal
Tenants see and pay invoices, browse their payment history, and land on clear success or cancel pages after a gateway redirect. Owners and assigned managers create utility bills (split equally among active leases) and list a room's invoices. All payments use a real gateway in test mode through the backend; nothing is ever marked paid by the UI.

## Tech used
Server Actions with `redirect()` for payment start, shared `GatewayPicker`, Server Components for the return pages with a small polling Client component, `@tanstack/react-form` + Zod for the utility bill form, TanStack Query lists with URL filters. Base stack: see 01-foundation.

## Roles
TENANT (invoices, pay, own payments). OWNER and PROPERTY_MANAGER (create utility bills, list room invoices; managers are payment-blind). ADMIN payment screens are in 16-admin.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/dashboard/invoices` | My invoices with status and type filters, Pay action | TENANT | Server + Client | P0 |
| `/dashboard/payments` | Payment history with status and purpose filters | TENANT | Server + Client | P0 |
| `/dashboard/payments/[paymentId]` | Payment detail (refund fields when refunded) | TENANT | Server | P1 |
| `/owner/invoices` | Pick a room, list its invoices, create utility bills | OWNER, PROPERTY_MANAGER | Server + Client | P0 |
| `/payment/success` | Payment result page | TENANT | Server + Client poller | P0 |
| `/payment/cancel` | Payment cancelled or failed | TENANT | Server | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/payment/gateways` | Public | — | Enabled gateways, `data.gateways: string[]` |
| GET | `/api/v1/payment/my-payments` | TENANT | — | Tenant's payments (filters status, purpose) |
| GET | `/api/v1/payment/:paymentId` | TENANT, ADMIN, SUPER_ADMIN | — | Payment detail (payer or admin) |
| GET | `/api/v1/invoice/my-invoices` | TENANT | — | Tenant's invoices (filters status, type) |
| POST | `/api/v1/invoice/utility-bill` | OWNER, PROPERTY_MANAGER | CreateUtilityBillZodSchema | Create a utility bill split among active leases |
| GET | `/api/v1/invoice/room/:roomId` | OWNER, PROPERTY_MANAGER | — | A room's invoices (owner or assigned manager) |
| POST | `/api/v1/invoice/:invoiceId/pay` | TENANT | PayInvoiceZodSchema | Opens a payment session, returns `{ payment, paymentUrl }` |

Not called from the UI (gateway to backend, or browser redirects the backend handles):

| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/payment/callback` | Public | — | bKash redirect target; backend verifies then redirects to the frontend |
| POST | `/api/v1/payment/confirm` | Public | — | SSLCommerz browser POST; backend verifies then redirects to the frontend |
| POST | `/api/v1/payment/ipn` | Public | — | SSLCommerz server notification |
| POST | `/api/v1/payment/webhook/stripe` | Public | — | Stripe signed webhook |

Also used here: `POST /api/v1/application/:applicationId/pay-deposit` (owned by 08) and `GET /api/v1/room/my-rooms` or `GET /api/v1/manager/my-properties` for the room picker.

## Zod schemas
Source: backend `invoice.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const CreateUtilityBillZodSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  amount: z
    .number("amount must be a number.")
    .positive("amount must be positive"),
  periodStart: z
    .string("Not a string.")
    .datetime({ offset: true, message: "periodStart must be a valid date" }),
  periodEnd: z
    .string("Not a string.")
    .datetime({ offset: true, message: "periodEnd must be a valid date" }),
  dueDate: z
    .string("Not a string.")
    .datetime({ offset: true, message: "dueDate must be a valid date" }),
  description: z.string("Not a string.").optional(),
});

const PayInvoiceZodSchema = z.object({
  gateway: z
    .enum(["bkash", "sslcommerz", "stripe"], "Unsupported payment gateway")
    .default("bkash"),
});
```

## Data and state
- `GET /payment/gateways` returns lowercase names (for example `["bkash","sslcommerz","stripe"]`, depends on the backend env). `GatewayPicker` renders one option per entry with labels: bkash "bKash (BDT)", sslcommerz "SSLCommerz (BDT)", stripe "Stripe (card, international)". Default to the first entry. Never hard-code the list.
- **Payment start** (`startPaymentAction({ kind: "invoice" | "deposit", id, gateway })`): `POST /invoice/:id/pay { gateway }` (or the deposit equivalent), then `redirect(paymentUrl)`. Allowed only when the invoice is UNPAID, no payment is in PROCESSING, PAID, REFUND_PENDING or REFUNDED, and the tenant's `verificationStatus` is APPROVED.
- Tenant invoice rows include `lease { id, monthlyRent }`, `room` with property, and `payment` (full or null). Filters `status`, `type`, `page`, `limit` in the URL, ordered by `periodStart` descending.
- Rent invoices are generated by the backend from the lease's second month (the deposit covers month one). Add this as a short help note.
- Owner list rows include `lease` with `tenantProfile { id, name, email }` and `payment`. **Managers receive no `payment`.** Room picker: owner uses `my-rooms`; manager uses rooms from `my-properties`.
- Utility bill: one invoice per active lease, equal split in 2-decimal precision (the last lease absorbs the remainder, e.g. 33.33, 33.33, 33.34). Show this explanation next to the amount.

## Payment return contract

### Required backend change B1 (small, do once)
The backend currently redirects to `/dashboard/my-applications?status=success`, `/dashboard/my-invoices?status=success|failure|cancel` and `/?payment=error`. These must become `/payment/success` and `/payment/cancel`.

Where:
- `src/app/module/payment/payment.service.ts`: the bKash callback (about lines 201 to 274) and the SSLCommerz confirm handler (about lines 316 to 390).
- `src/app/lib/payments/adapters/stripe.ts`: `success_url` and `cancel_url` (about lines 128 to 129).

How: add one helper and use it at every place above.

```ts
// src/app/lib/payments/redirect.ts
import { config } from "../../config";

export const frontendPaymentRedirect = (p: {
  outcome: "success" | "cancel";
  purpose?: "DEPOSIT" | "RENT" | "UTILITY";
  ref?: string; // merchantInvoiceNumber: application id (DEPOSIT) or invoice id (RENT, UTILITY)
  paymentId?: string; // local Payment.id when known
  reason?: "failure" | "cancel" | "error";
}) => {
  const q = new URLSearchParams();
  if (p.purpose) q.set("purpose", p.purpose);
  if (p.ref) q.set("ref", p.ref);
  if (p.paymentId) q.set("paymentId", p.paymentId);
  if (p.reason) q.set("reason", p.reason);
  const qs = q.toString();
  return `${config.frontend_url}/payment/${p.outcome}${qs ? `?${qs}` : ""}`;
};
```

Rules: a successful settle redirects with `outcome: "success"`; failure, cancel, unknown status and error all use `outcome: "cancel"` with the matching `reason`. Stripe `success_url` and `cancel_url` use the same helper with the purpose and `ref` known at session creation. The backend has no test suite: verify each gateway by hand (bKash success, failure and cancel; SSLCommerz success and cancel; Stripe success and cancel).

### Frontend handling
- `/payment/success` is a Server Component. Without a session it redirects to `/login?redirectTo=<this url>`. It resolves the payment: if `paymentId` is present call `GET /payment/:paymentId`; otherwise call `GET /payment/my-payments?purpose=<purpose>` and match `ref` against `row.application.id` or `row.invoice.id`. If it cannot resolve the payment, show a neutral message and a link to Payments.
- **Never assume paid from the URL.** Render by `payment.status`: PAID shows amount, gateway, transaction id and a next step (DEPOSIT links to `/dashboard/leases`; RENT and UTILITY link to `/dashboard/invoices`); PROCESSING shows "We are confirming your payment" and a Client poller refetches every 3 seconds for about 30 seconds, then shows "Still confirming, check Payments in a moment"; any other status shows a neutral explanation with a retry link.
- `/payment/cancel` shows a message by `reason` (`cancel`: "You cancelled the payment"; `failure`: "The payment failed"; `error` or missing: "Something went wrong"), and a retry link by purpose (deposit to `/dashboard/applications`, otherwise `/dashboard/invoices`).

## States
Skeletons for lists; empty states ("No invoices yet", "No payments yet", "No invoices for this room"); disabled Pay button with reasons (not verified, payment in progress); error states with retry; a distinct "in progress" badge when `payment.status` is PROCESSING.

## UX notes
- Pay opens a dialog with amount, due date, `GatewayPicker`, and a short note on the selected gateway. Provide a test-mode hint ("Sandbox payments, no real money").
- Utility bill form: room (preselected from the picker), amount, period start and end, due date, optional description; confirm dialog showing the per-lease split count when known.
- Payment history rows show purpose, amount, status, gateway, related room or invoice, and date; detail (P1) shows transaction ids and refund fields.

## Backend rules the UI must respect
- Pay: the invoice must belong to the tenant (403), the tenant must be verified (403 "Your tenant account is not verified yet…"), the invoice must be UNPAID (409 "Invoice is already X"), and a payment in progress or completed gives 409 "A payment for this invoice is already in progress or completed". FAILED and CANCELLED sessions can be retried. Unknown or disabled gateway gives 400.
- Invoice status after a gateway cancel returns to UNPAID; after failure it becomes FAILED; PAID only after the verified callback. CANCELLED appears only after lease termination.
- Utility bill: needs at least one ACTIVE lease (409 "Room has no active lease to bill"); a second bill for the same period gives 409 "Duplicate Key Error". Owners need an APPROVED profile; assigned managers can create bills for assigned rooms.
- Room invoices for a room the caller does not own or manage give a generic 404 "Room not found".
- Payment detail is visible only to the payer and admins (403 otherwise).
- Money fields are strings; amounts are in BDT.

## Acceptance checklist
- [ ] Tenant pays an invoice through each enabled gateway in test mode and lands on `/payment/success` with PAID (or the confirming state, then PAID).
- [ ] Cancelling at the gateway lands on `/payment/cancel`; the invoice is UNPAID again and can be retried.
- [ ] Opening `/payment/success` without a real payment never shows "paid".
- [ ] Backend change B1 is applied and verified for bKash, SSLCommerz and Stripe.
- [ ] An unverified tenant sees Pay disabled with the reason.
- [ ] Owner and assigned manager create a utility bill; duplicates and no-lease cases show the backend message; managers see no payment data.
- [ ] Payment history filters by status and purpose through the URL.

## Out of scope
Receipt PDF download (emailed by the backend), refund requests by tenants, admin payment screens (16-admin), saved cards.
