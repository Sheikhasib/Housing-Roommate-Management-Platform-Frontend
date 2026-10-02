# Spec 12 — Payments (Multi-Gateway: bKash + SSLCommerz + Stripe)

## Overview

Money moves through **three gateway adapters** behind one contract (`src/app/lib/payments/`): **bKash Tokenized Checkout** (BDT, sandbox by default, `lib/bKash.ts` + native `fetch`), **SSLCommerz** (BDT, sandbox, GearUp pattern: form-urlencoded `axios` init + server-side validator API as the trust anchor) and **Stripe Checkout** (international, test mode, Prisma Press pattern: signed webhook as the trust anchor). `GET /api/v1/payment/gateways` (public) lists the enabled adapters (env-driven); `pay-deposit`/`invoice pay` accept an optional `gateway` body field (validated enum `bkash|sslcommerz|stripe`, default `bkash`; unknown/disabled → 400 `"Unsupported payment gateway"`).

A single `Payment` row is created at session initiation (status PROCESSING, `gateway` + minor-units `providerChargeAmount/Currency` snapshot for the I-G2 settle check) and only reaches PAID/FAILED/CANCELLED/REFUNDED through **provider-verified** notify routes — the bKash redirect callback (server-to-server execute), the SSLCommerz `/confirm`/`/ipn` (validator `VALID|VALIDATED` only), or the Stripe `/webhook/stripe` (`constructEvent` signature + `checkout.session.completed`/`expired` allowlist). Adapter-layer rules: adapters own provider HTTP only — `lib/payments/settle.ts` is the single place that turns a verified confirmation into money state (I-G1) and verifies the provider-reported amount against the initiation snapshot in **minor units** (I-G2; adapters normalize: bKash/SSLCommerz taka ×100, Stripe already minor units → mismatch stays PROCESSING + `PAYMENT_AMOUNT_MISMATCH` audit). Failure/cancel writes are conditional on PROCESSING (I-G4 — a late event can never clobber a settled row); replays are no-ops (I-G3). Two business flows exist: **DEPOSIT** (on an APPROVED application → creates the ACTIVE lease, occupies a bed, emails a PDF receipt) and **RENT/UTILITY** (pays an invoice → marks it PAID). Admin can list all payments; a tenant can list/pay only their own; a single payment detail is payer-or-admin only. Refunds are issued only from lease termination (spec 10) — dispatched on `payment.gateway` (bKash saga unchanged; Stripe via `stripe.refunds.create` mapped into the same reservation pattern; SSLCommerz has no automated refund: the deposit is parked REFUND_PENDING with a `REFUND_MANUAL_REQUIRED` audit and clear 409 guidance for the admin refund queue). Payments stuck PROCESSING >24h are probed daily by the `reconcileStaleProcessingPayments` cron (00:25 + boot catch-up): definitive failed/expired → conditional downgrade (retryable); paid/ambiguous → `PAYMENT_STALE_FLAGGED` audit routing to the admin settle queue — the cron NEVER auto-settles (I-G5). Stranded-success rows are rescued by admins via `GET/POST /api/v1/admin/payments/pending-settlements(/:id/resolve)` (mirrors the REFUND_PENDING queue; `SETTLED` runs the same guarded settle path, `NOT_SETTLED` → FAILED retryable, `PENDING_SETTLEMENT_RESOLVED` audit + tenant notification).

Provider-neutral Payment columns under legacy names (`bKashPaymentId` = provider session/tran id, `bKashTrxId` = provider trx id, `paidAt`, `gatwayResponse` = raw payload) — documented in `lib/payments/types.ts`; `merchantInvoiceNumber` stays THE subject key; provider refs are gateway-scoped (`@@index([gateway, bKashPaymentId])`).

## Depends on

- `prisma/schema/payment.prisma`, `application.prisma`, `invoice.prisma`, `lease.prisma`, `room.prisma`, `enums.prisma`
- `src/app/lib/bKash.ts`, `redis.ts` (token cache), `cron.ts` (reconciliation cron)
- `src/app/lib/payments/{types,registry,settle}.ts` + `adapters/{bkash,sslcommerz,stripe}.ts`, `src/app/lib/stripe.ts` (`getStripe`), `config` (`ssl_commerz_*`, `stripe_*`, `backend_public_url`)
- `src/app/utils/roomStatus.ts`, `notification.ts`, `email.ts`
- pdfkit — styled receipts via `buildReceiptPdf` in `src/app/utils/pdf.ts` (brand header band, PAID pill, amount summary card, striped detail rows; shared by deposit + invoice receipts; formatters `formatReceiptAmount`/`formatReceiptDate`/`gatewayDisplayName`)
- `src/app/module/payment/*` (route/controller/service only — no validation/interface files)
- Mount: `/api/v1/payment` in `src/app/app.ts`; callback URL = `BKASH_CALLBACK_URL` + `/payment/callback`; SSLCommerz notify URLs = `BACKEND_PUBLIC_URL` + `/api/v1/payment/confirm|/ipn`; Stripe webhook = `/api/v1/payment/webhook/stripe` (raw-body mount before the JSON parsers)
- Template: `payment-receipt`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/payment/gateways` | none (public) | 200 `"Payment gateways fetched successfully"` → `data.gateways: string[]` (env-driven) |
| GET | `/api/v1/payment/callback` | none (public; bKash gateway redirect) | HTTP 302 `res.redirect(result.redirectUrl)` |
| POST | `/api/v1/payment/confirm` | none (public; SSLCommerz success/fail/cancel POST; pre-rate-limiter) | HTTP 302 redirect to the frontend (status per purpose) |
| POST | `/api/v1/payment/ipn` | none (public; SSLCommerz IPN; pre-rate-limiter) | 200 JSON (GearUp pattern) |
| POST | `/api/v1/payment/webhook/stripe` | none (public; raw-body mount before the JSON parsers; pre-rate-limiter) | 200 ack (Stripe requires 2xx; error envelope would trigger retries) |
| GET | `/api/v1/payment/my-payments` | auth(TENANT) | 200 `"Payments fetched successfully"` (meta) | TENANT |
| GET | `/api/v1/payment/all-payments` | auth(ADMIN, SUPER_ADMIN) | 200 `"Payments fetched successfully"` (meta) | ADMIN/SUPER_ADMIN |
| GET | `/api/v1/payment/:paymentId` | auth(TENANT, ADMIN, SUPER_ADMIN) | 200 `"Payment fetched successfully"` | Payer tenant or admin |

Session-initiation endpoints live in other modules: `POST /api/v1/application/:applicationId/pay-deposit` (spec 09) and `POST /api/v1/invoice/:invoiceId/pay` (spec 11).

## Request/response contracts

No zod schemas in this module. Callback reads GET query `paymentID` and `status`; missing either → 400 `"Invalid bKash callback query"`.

**List query params** (raw `IQuery`): page=1, limit=10, optional `status` and `purpose` filters; order `createdAt desc`. Includes:
- `my-payments` → payments scoped to the caller's tenant profile via application or invoice; rows include `application { id, status, room { id, name } }` and `invoice { id, type, amount, dueDate }`.
- `all-payments` → rows include `application { id, tenantProfile { id, name, email } }` and `invoice { id, type, lease { tenantProfile { id, name, email } } }`.
- `:paymentId` → full Payment row with `application` (incl. tenantProfile) and `invoice` (incl. lease + tenantProfile).

## bKash lib behaviors

- `getBkashIdToken()` — Redis-cached (`bKash: idToken` EX 3600s, `bKash: refreshToken` EX 28d); refreshes when id TTL ≤ 600s, else re-grants. 502 `"Failed to refresh bKash id token"` / `"Failed to get bKash ID Token"`.
- `createBkashPayment({ amount, payerReference, merchantInvoiceNumber, callbackPath })` — POST `/tokenized/checkout/create` with `X-App-Key`, body `{ mode: "0011", payerReference, callbackURL: bkash_callback_url + callbackPath, amount, currency: "BDT", intent: "sale", merchantInvoiceNumber }`. Non-OK → 502 (statusMessage). Returns `paymentID` + `bkashURL`.
- `executeBkashPayment(paymentID)` — POST `/tokenized/checkout/execute`; returns `trxID`, `paymentExecuteTime`, `merchantInvoiceNumber`.
- `refundBkashPayment({ paymentID, trxID, amount, reason, sku })` — POST `/tokenized/checkout/payment/refund`; returns `refundTrxID`, `completedTime` (used by lease termination only).

## Business rules (callback flow)

`paymentCallback(query)`:
1. Require `paymentID` + `status` (400 otherwise).
2. Find the local Payment by `bKashPaymentId` OR `merchantInvoiceNumber` (404 `"Payment not found"`).
3. If `status === "success"`: `executeBkashPayment(paymentID)` server-to-server confirm (502 on failure), then:
   - `DEPOSIT` → transaction `handleDepositSuccess`:
      - idempotent if payment already PAID or a lease already exists (returns `alreadyPaid`).
      - application must still be APPROVED else 409 `"Application is no longer approved. Deposit cannot be confirmed."`
      - `startDate = max(moveInDate, now)`, `endDate = +leaseMonths`; conditional bed increment: `room.updateMany({ occupiedBeds: { lt: bedCount } }, occupiedBeds: { increment: 1 } })` — count 0 → 409 `"No bed is available in this room anymore."` (this atomic write prevents double-booking the last bed).
      - creates the ACTIVE `Lease` (rent + deposit snapshots); marks payment PAID (`bKashTrxId`, `paidAt`, `gatwayResponse`); `recalculateRoomStatus`; owner LEASE notification `"New tenant confirmed 🎉"`.
       - Then (fail-soft — never 500 the redirect after the commit): tenant PAYMENT notification `"Deposit paid ✅"`; styled PDF receipt (pdfkit, `deposit-receipt.pdf` attachment, fields incl. amount + trx + property/room/lease term) emailed via `payment-receipt`; redirect to frontend `/dashboard/my-applications?status=success`.
    - RENT/UTILITY → transaction `handleInvoiceSuccess` (also returns the settled payment row + room/property for the receipt): mark invoice PAID + payment PAID (skip if already PAID). Tenant PAYMENT notification `"Invoice paid 💰"` + styled PDF receipt (`invoice-receipt.pdf` — billing period, due date, method, trx) via `payment-receipt` (both fail-soft). Redirect `/dashboard/my-invoices?status=success`.
4. `failure`/`cancel` → **no gateway execute call** (the session was never completed): payment FAILED/CANCELLED (+ `gatwayResponse` = raw callback payload). For invoice payments: failure sets invoice FAILED; cancel returns invoice to UNPAID. Deposit failures do not revert anything (application stays APPROVED). Redirect `/dashboard/my-invoices?status=<status>`.
5. Unknown status → redirect frontend `?payment=error`.

- `getMyPayments` — tenant scope: `{ OR: [{ application: { tenantProfileId } }, { invoice: { lease: { tenantProfileId } } }] }` (+status/purpose).
- `getAllPayments` — admin list.
- `getSinglePayment` — payer tenant (via application/invoice → tenant profile) or admin; otherwise 403 `"You cannot view this payment"`. Owners are excluded.

PaymentStatus: `UNPAID → PROCESSING (initiation) → PAID | FAILED | CANCELLED | REFUND_PENDING | REFUNDED` — the only PAID writer is the execute/callback path. Deposit refunds come from lease termination (spec 10): the refund saga reserves PAID → REFUND_PENDING before the gateway call and settles on REFUNDED (or back to PAID on definitive failure); stuck REFUND_PENDING rows are reconciled by admins (spec 15). Invoice payments have no refund path. Revenue/earnings (analytics + admin dashboard) are computed as Σ PAID only — refunded payments have already left PAID, so they are excluded automatically and never double-counted.

## Data model

`Payment` (`payments`): id uuid, `status` default UNPAID (idx), `purpose` default DEPOSIT (idx), `gateway PaymentGateway` default BKASH (BKASH/SSLCOMMERZ/STRIPE; migration backfilled all rows to BKASH and dropped the legacy free-text column), `amount` Decimal(10,2), `currency` default "BDT", `providerChargeAmount Int?` + `providerChargeCurrency String?` (minor-units snapshot for I-G2), `merchantInvoiceNumber @unique` (application or invoice id — THE subject key), `bKashPaymentId?` (provider session/tran id — gateway-scoped, `@@index([gateway, bKashPaymentId])`), `bKashTrxId?` (provider trx id), `payerReference?`, `paidAt?` (string, provider-reported), `gatwayResponse Json?` (raw provider payload; column keeps the typo), refund fields (`refundTrxId?`, `refundAmount?`, `refundReason?`, `refundAt?`), timestamps (no soft delete); optional 1:1 `applicationId @unique` / `invoiceId @unique` (exactly one set by purpose).

## Definition of done

- [ ] `GET /payment/gateways` returns exactly the env-enabled adapters (`["bkash"]` creds-less, `["bkash","sslcommerz","stripe"]` fully configured); `pay-deposit`/`pay` with an unknown or disabled gateway → 400 `"Unsupported or disabled payment gateway"`.
- [ ] `POST ./pay-deposit` and `POST ./invoice/:id/pay` create/refresh PROCESSING Payment rows (gateway + charge snapshot + `PAYMENT_INITIATED` audit) and return the provider URL (bKash `bkashURL` / SSLCommerz `GatewayPageURL` / Stripe Checkout URL); repeated initiation upserts rather than duplicating; duplicate live sessions → 409.
- [ ] Simulating the gateway redirect to `GET /api/v1/payment/callback?paymentID=.&status=success` (deposit) creates the ACTIVE lease, increments occupancy exactly once, marks payment PAID, notifies both tenant and owner, emails the PDF receipt, and is idempotent on retry.
- [ ] Invoice-success callback marks invoice + payment PAID and notifies the tenant.
- [ ] failure/cancel callbacks set FAILED/CANCELLED (conditional on PROCESSING — a late event after settle is a no-op) and restore the invoice to UNPAID on cancel - without calling the gateway execute endpoint (cancelled/failed sessions never execute).
- [ ] SSLCommerz: forged `/confirm`/`/ipn` without a valid `val_id` → FAILED, never settles; validator `VALID`/`VALIDATED` settles; idempotent double-IPN is a no-op.
- [ ] Stripe: invalid webhook signature → 400; `checkout.session.completed` with `payment_status=paid` settles; `checkout.session.expired` while PROCESSING → CANCELLED (terminal → no-op); replayed events are no-ops; non-allowlisted events are acked without state change; the event's `amount_total` (minor units) is the amount of record.
- [ ] I-G2: a provider-reported amount ≠ snapshot stays PROCESSING + `PAYMENT_AMOUNT_MISMATCH` audit (admin-visible). **Legacy rows** initiated before the snapshot column existed (null `providerChargeAmount`) fall back to the ledger amount (BDT x100) for the comparison; a null reported amount (admin resolve) settles on admin authority.
- [ ] Admin settle queue: lists stale PROCESSING rows; `SETTLED` resolve runs the guarded settle (lease/bed/invoice side effects + audits); `NOT_SETTLED` → FAILED (tenant can retry); double-resolve → 409.
- [ ] Termination refund dispatch: bKash saga unchanged; Stripe refund through the same reservation pattern; SSLCommerz deposit → parked REFUND_PENDING + `REFUND_MANUAL_REQUIRED` audit + 409 guidance.
- [ ] Reconciliation cron never sets PAID: definitive failures downgraded, paid/ambiguous flagged (`PAYMENT_STALE_FLAGGED`) into the admin settle queue.
- [ ] Tenant lists only their payments; admin lists all; non-payer/non-admin single-payment read → 403.
- [ ] `lint:check`/`format:check`/`build` pass.
