# Spec 10 — Lease Management

## Overview

A `Lease` is the binding tenancy created **only** when a booking-deposit bKash payment succeeds on an APPROVED application (payment module, spec 12) — there is no public create endpoint here. This module reads leases (tenant/owner/assigned-manager-view scoped + detail), supports **termination** (by tenant, owner, or admin — **not** by managers) which frees a bed, cancels unpaid invoices, and refunds the deposit via bKash if the lease hasn't started, uploads/removes lease documents (Cloudinary, owner/admin only for removal), and exposes the shared `Application` context. Completed leases are produced automatically by the daily cron.

## Depends on

- `prisma/schema/lease.prisma`, `application.prisma`, `invoice.prisma`, `room.prisma`, `enums.prisma`
- `src/app/utils/roomStatus.ts`, `audit.ts`, `notification.ts`, `email.ts`, `cloudinaryUpload.ts`, `propertyAccess.ts` (`propertyManagerScope`)
- `src/app/lib/bKash.ts` (`refundBkashPayment`), `multer.ts`, `cron.ts` (context)
- `src/app/module/lease/*`; cross-module: `payment.service.ts` (lease creation)
- Mount: `/api/v1/lease` in `src/app/app.ts`
- Template: `lease-terminated`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/lease/my-leases` | auth(TENANT) | 200 `"Leases fetched successfully"` (meta) | TENANT |
| GET | `/api/v1/lease/owner-leases` | auth(OWNER, PROPERTY_MANAGER) | 200 `"Leases fetched successfully"` (meta) | OWNER (verified) or assigned MANAGER (view-only) |
| GET | `/api/v1/lease/:leaseId` | auth(TENANT, OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN) | 200 `"Lease fetched successfully"` | Participant/owner/assigned manager (view-only)/admin |
| POST | `/api/v1/lease/:leaseId/terminate` | auth(TENANT, OWNER, ADMIN, SUPER_ADMIN), validateRequest(TerminateLeaseZodSchema) | 200 `"Lease terminated successfully"` | Participant/owner/admin (manager excluded) |
| POST | `/api/v1/lease/:leaseId/documents` | auth(TENANT, OWNER, ADMIN, SUPER_ADMIN), upload.single("document") | 201 `"Lease document uploaded successfully"` | Tenant/owner/admin (manager excluded) |
| DELETE | `/api/v1/lease/:leaseId/documents/:documentId` | auth(OWNER, ADMIN, SUPER_ADMIN) | 200 `"Lease document removed successfully"` | OWNER/ADMIN (tenant cannot) |

## Request/response contracts

**`TerminateLeaseZodSchema`**: `reason` string required, min 3 (`"Reason must be at least 3 characters long"`), max 300 (`"Reason must be at most 300 characters"`).

**Documents**: upload is `multipart/form-data`, field `document` (single; `uploadDocuments`: images or PDF, 8 MB limit); optional `name` field (controller defaults `"rental-agreement"`). No file → 400 `"No document uploaded"`.

**Query params** (lists, raw): page=1, limit=10, optional `status`; `owner-leases` also optional `roomId`; order `createdAt desc`.

Response shapes:
- `my-leases` → rows with full `room` incl. `property { id, title, city, area, images }`, `invoices[]`, `documents[]`, `application` (incl. `payment`).
- `owner-leases` → rows with `tenantProfile { id, name, email, contactNumber, user { imageUrl } }`, `room { id, name, monthlyRent }`, `invoices`, `application` (incl. payment).
- `:leaseId` → single with tenantProfile (incl. user), full room incl. property + owner `{ id, userId, name, email }`, `invoices` (ordered periodStart desc), `documents`, `application` (incl. payment).
- `terminate` → `{ lease, refund: { status: "REFUNDED", refundTrxId } | null }`.
- documents → created `LeaseDocument` / `{ message: "Lease document removed successfully" }`.

## Business rules

- Access helpers: tenant = `lease.tenantProfile.userId === user.userId`; owner = `lease.room.property.owner.userId === user.userId`; manager = assigned to `lease.room.property` (via the property-manager join, **view-only**); admin = role in [ADMIN, SUPER_ADMIN]. Violations → 403 (`"You are not allowed to view this lease"`, `"…to terminate this lease"`, `"…to upload documents to this lease"`, `"…to remove documents from this lease"`).
- Managers are **view-only**: they cannot call `terminate`, upload lease documents, or remove documents. Those routes keep their existing role sets (TENANT/OWNER/ADMIN/SUPER_ADMIN participants; document removal OWNER/ADMIN). Manager-visible lease responses (`owner-leases`, `:leaseId`) are **payment-blind** — `application.payment` is stripped for PROPERTY_MANAGER viewers (spec 17 money isolation).
- `terminateLease` — must be ACTIVE else 409 `` `Lease is already ${status.toLowerCase()}` ``. Refund + termination run as a guarded saga (no HTTP call inside a DB transaction):
  1. If the deposit payment is REFUND_PENDING (a previous refund with unknown outcome) → 409 `"A deposit refund for this lease is already in progress. Please wait for it to be reconciled."`.
  2. Refund path (payment PAID **and** `startDate` in the future): reserve with a conditional write `PAID → REFUND_PENDING` (concurrent terminations can never double-refund; a lost reservation race → 409 `"Deposit refund already initiated by another request"`), then call `refundBkashPayment` **outside** any transaction (30s abort). A definitive gateway rejection releases the reservation back to PAID and rethrows (retryable). An ambiguous outcome (timeout/network → `BkashAmbiguousError`) keeps REFUND_PENDING, writes a `REFUND_OUTCOME_UNKNOWN` audit entry and aborts with 502 — the refund is held for admin reconciliation (spec 15), never blind-retried.
  3. On refund success: payment → REFUNDED (`refundTrxId/refundAmount/refundReason/refundAt/gatwayResponse`) + `PAYMENT_REFUNDED` audit in its own transaction, **before** the lease changes — a crash in between self-heals (a retry terminates without refunding again).
  4. Termination: guarded transaction (conditional `updateMany` keyed on ACTIVE) setting `TERMINATED` + `terminationReason/terminatedBy/terminatedAt`, freeing one bed (decrement `occupiedBeds` if > 0 + `recalculateRoomStatus`), cancelling the lease's UNPAID/PROCESSING invoices, writing the `LEASE_TERMINATED` audit atomically, and — P3 — closing any live `RoommateMembership` (PENDING/ACTIVE → REMOVED, `removedBy` = terminator, reason "Lease terminated") with one `MEMBERSHIP_REMOVED` audit row per membership in the same transaction (no orphaned members). A lost race → 409 `"Lease is no longer active. Termination aborted."`.
  After commit: LEASE notification `"Lease terminated 📄"` and email `lease-terminated` (refunded/not-refunded copy) to the lessee, a ROOMMATE notification to each closed member, and a LEASE notification to the property owner when the owner is not the actor (an owner never loses a tenant silently) — each fail-soft. Returns `{ lease, refund | null }`.
- `uploadLeaseDocument` — participant/owner/admin may attach; uploads to Cloudinary folder `lease-documents`, inserts `LeaseDocument` with the name passed by the controller (always non-empty; defaults to `"rental-agreement"`). No status requirement.
- `removeLeaseDocument` — owner/admin only; deletes the DB row (Cloudinary asset is not removed).
- Lease creation (external, spec 12): on deposit success → `startDate = max(moveInDate, now)`, `endDate = startDate + leaseMonths`, `monthlyRent`/`depositAmount` snapshots, status ACTIVE, `occupiedBeds` +1 (guarded), room status recomputed.
- Auto completion (cron 00:15): ACTIVE leases with `endDate < today` → COMPLETED, bed freed, and live roommate memberships closed in the same transaction (`removedBy: "system-cron"`, reason "Lease completed", `MEMBERSHIP_REMOVED` audit with SYSTEM actor; member notified fail-soft). No other notifications.

LeaseStatus flow: created `ACTIVE` (payment callback) → `TERMINATED` (this module) or `COMPLETED` (cron). No manual reactivation.

## Data model

`Lease` (`leases`): id uuid, `startDate`, `endDate`, `monthlyRent` Decimal(10,2), `depositAmount` Decimal(10,2), `status` default ACTIVE (idx), `terminationReason?`, `terminatedBy?`, `terminatedAt?`, soft-delete, timestamps; `applicationId @unique` → Application (cascade), `tenantProfileId` (cascade, idx), `roomId` (cascade, idx); relations `invoices[]`, `documents[]`, `maintenanceRequests[]`. `LeaseDocument` (`lease_documents`): id uuid, `name`, `url`, `publicId?`, `description?`, timestamps (no soft delete), `leaseId` (cascade). No schema changes required.

## Definition of done

- [ ] A lease appears after the deposit callback succeeds (ACTIVE, rent/deposit snapshots, one bed occupied) — see spec 12 verification too.
- [ ] TENANT/OWNER/ADMIN can view leases; scoped lists (tenant/owner) filter correctly.
- [ ] Assigned MANAGER views the property's leases and lease detail only (view-only); terminate or document upload → 403; unassigned MANAGER → 403.
- [ ] Terminate an ACTIVE lease → bed freed, room status recomputed, unpaid invoices cancelled; paid + future start → bKash refund issued and payment REFUNDED (happy path).
- [ ] Terminate a started lease → no refund (`refund: null`).
- [ ] Refund saga edge cases: already-REFUND_PENDING payment → 409 (held for reconciliation); definitive gateway failure → payment back to PAID, lease still ACTIVE (retryable); reconciled-REFUNDED payment then retry terminate → succeeds with `refund: null` (no double refund). See spec 15 for the reconciliation endpoints.
- [ ] Tenant uploads a document; only OWNER/ADMIN can delete it.
- [ ] `lint:check`/`format:check`/`build` pass.
