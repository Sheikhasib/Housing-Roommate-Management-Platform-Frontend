# Spec 11 — Invoices & Billing

## Overview

Two invoice types settle through bKash (spec 12): **RENT** invoices are auto-generated monthly by cron from the second lease month (the booking deposit covers month one) and **UTILITY** invoices are created by an OWNER or an **assigned PROPERTY_MANAGER** (spec 17) for a room and split equally among its active leases, with exact 2-decimal remainder handling. TENANTs view their invoices and pay them (identity-verified tenants only — spec 03); OWNERs and assigned MANAGERs view invoices per room; everyone gets `INVOICE` notifications + `invoice-created` emails for utilities. One Payment row exists per invoice (unique `invoiceId`).

## Depends on

- `prisma/schema/invoice.prisma`, `lease.prisma`, `payment.prisma`, `room.prisma`, `enums.prisma`
- `src/app/lib/bKash.ts` (`createBkashPayment`), `cron.ts` (rent generation), `notification.ts`, `email.ts`, `propertyAccess.ts` (`propertyManagerScope`)
- `src/app/module/invoice/*`
- Mount: `/api/v1/invoice` in `src/app/app.ts`
- Template: `invoice-created`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/invoice/my-invoices` | auth(TENANT) | 200 `"Invoices fetched successfully"` (meta) | TENANT |
| POST | `/api/v1/invoice/utility-bill` | auth(OWNER, PROPERTY_MANAGER), validateRequest(CreateUtilityBillZodSchema) | 201 `"Utility bill created and split among roommates"` | OWNER (verified) or assigned MANAGER (of room) |
| GET | `/api/v1/invoice/room/:roomId` | auth(OWNER, PROPERTY_MANAGER) | 200 `"Invoices fetched successfully"` (meta) | OWNER or assigned MANAGER (of room) |
| POST | `/api/v1/invoice/:invoiceId/pay` | auth(TENANT), validateRequest(PayInvoiceZodSchema: gateway enum bkash|sslcommerz|stripe, default bkash) | 200 `"Payment session created successfully"` | TENANT (lessee) |

## Request/response contracts

**`CreateUtilityBillZodSchema`**: `roomId` required (`"roomId is required"`); `amount` number positive (`"amount must be positive"`); `periodStart`, `periodEnd`, `dueDate` all ISO offset datetimes (`"… must be a valid date"`); `description` string optional.

**Query params** (both lists, raw): page=1, limit=10, optional `status` and `type` filters; order `periodStart desc`. (`searchTerm`/`sortBy`/`sortOrder` ignored.)

Response shapes:
- `my-invoices` → rows with `lease { id, monthlyRent }`, `room` incl. `property { id, title, city }`, and `payment` (full or null).
- `room/:roomId` → rows with `lease` incl. `tenantProfile { id, name, email }`, and `payment`.
- `utility-bill` → the created invoice array.
- `:invoiceId/pay` → `{ payment, paymentUrl }`.

## Business rules

- `getMyInvoices` — tenant scope via `lease.tenantProfileId` (404 `"Tenant profile not found"`), optional status/type, `isDeleted: false`.
- `getRoomInvoices` — the room must be owned (`property.ownerId`) or the caller an assigned manager (manager-scoped lookup) else generic 404 `"Room not found"` (no ownership leak). Scope `{ roomId, isDeleted: false }`. Manager responses are **payment-blind**: the `payment` include is stripped for PROPERTY_MANAGER viewers (spec 17 money isolation).
- `createUtilityBill` (transaction) — owner of the room or an assigned manager; must have ≥1 ACTIVE lease else 409 `"Room has no active lease to bill"`. Equal split in 2-decimal precision: convert amount to paisa (`round(amount*100)`), floor-divide by lease count, give the **last** lease the rounding remainder (`33.33, 33.33, 33.34`). One UTILITY invoice per active lease with `description = payload.description || "Utility bill for <room.name>"`. The transaction also writes a `UTILITY_BILL_CREATED` audit entry (entity Room; after = amount, periodStart, invoicesCreated) with `actorRole` recorded. After commit, per invoice: INVOICE notification `"Utility bill generated 💡"` and `invoice-created` email (৳ amount). Duplicate period re-bill → 409 `"Duplicate Key Error"` (`@@unique([leaseId, type, periodStart])`).
- `payInvoice` — tenant owns it (403 `"You can only pay your own invoices"`); the caller's tenant profile must be **VERIFIED** (spec 03) else 403 `"Your tenant account is not verified yet. Please complete identity verification before paying"`; invoice must be UNPAID else 409 `` `Invoice is already ${status.toLowerCase()}` ``. Because the invoice itself stays UNPAID while a session is in flight, an existing Payment for the invoice in PROCESSING/PAID/REFUND_PENDING/REFUNDED → 409 `"A payment for this invoice is already in progress or completed"` (FAILED/CANCELLED sessions may be retried) — this blocks double-charging at the gateway. Purpose from type (RENT/UTILITY). Calls `createBkashPayment` (`merchantInvoiceNumber = invoice.id`), upserts Payment (status PROCESSING) on unique `invoiceId`; returns `{ payment, paymentUrl }`. Invoice status stays UNPAID until the callback resolves it (spec 12).
- **Cron `generateMonthlyRentInvoices`** (daily 00:10 + boot catch-up): for each ACTIVE lease, walk months from `startDate + 1 month` to before `endDate`, generating only periods already started, `amount = lease.monthlyRent`, `dueDate = periodStart`, idempotent. No notifications/emails.

InvoiceStatus transitions: callback success → `PAID`; callback failure → `FAILED`; gateway cancel → back to `UNPAID` so the tenant can retry. `CANCELLED` is set only by lease termination (unpaid/processing invoices of a terminated lease). Invoice-level `REFUNDED` is currently unused — refunds only exist for booking deposits via the termination saga (spec 10).

## Data model

`Invoice` (`invoices`): id uuid, `type` default RENT, `amount` Decimal(10,2), `periodStart`, `periodEnd`, `dueDate`, `status` default UNPAID (idx), `description?`, soft-delete, timestamps; `leaseId` (cascade, idx), `roomId` (cascade, idx); `@@unique([leaseId, type, periodStart])`; 1:1 `payment?`. No schema changes required.

## Definition of done

- [ ] RENT invoice appears for an active lease's second month onward (cron; verify by running the boot catch-up or triggering the job).
- [ ] OWNER or assigned MANAGER creates a utility bill for a room → one invoice per active lease, last lease absorbs the remainder; tenants get notification + email; unassigned MANAGER → 403.
- [ ] TENANT sees only their invoices; OWNER/MANAGER sees only their rooms'; paying someone else's invoice → 403.
- [ ] Creating a second utility bill for the same period → 409.
- [ ] Paying an UNPAID invoice returns a bKash session; re-pay while not UNPAID → 409; re-pay while a session is in flight (invoice still UNPAID, payment PROCESSING) → 409; a not-yet-VERIFIED tenant → 403.
- [ ] `lint:check`/`format:check`/`build` pass.
