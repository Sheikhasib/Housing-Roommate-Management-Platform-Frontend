# Spec 09 — Rental Applications & Deposit

## Overview

TENANTs apply to rent a published room (single-tenant or as part of a `RoommatePair`). The room's verified OWNER — or an **assigned PROPERTY_MANAGER** (spec 17) — reviews each PENDING application: approving is gated on available bed capacity, rejecting requires a reason. An APPROVED application then lets the tenant pay the booking deposit through bKash (`pay-deposit` opens the payment session; lease creation happens later in the bKash callback — spec 12); only **identity-verified** tenants (spec 03/15) may start a payment session. Applications can be cancelled while PENDING/APPROVED by the tenant or an admin, but never after a paid/processing payment exists. Approval does **not** auto-create a lease, invoice, or room RESERVED status — deposits drive those. Notifications (`APPLICATION`) and emails inform both sides.

## Depends on

- `prisma/schema/application.prisma`, `room.prisma`, `payment.prisma`, `lease.prisma`, `roommate.prisma`, `enums.prisma`
- `src/app/utils/audit.ts`, `notification.ts`, `email.ts`, `roomStatus.ts`, `propertyAccess.ts` (`propertyManagerScope`)
- `src/app/module/application/*`; cross-module: `src/app/module/payment/payment.service.ts` (deposit-success callback)
- Mount: `/api/v1/application` in `src/app/app.ts`
- Templates: `application-approved`, `application-rejected`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| POST | `/api/v1/application/apply` | auth(TENANT), validateRequest(ApplyForRoomZodSchema) | 201 `"Application submitted successfully"` | TENANT |
| GET | `/api/v1/application/my-applications` | auth(TENANT) | 200 `"Applications fetched successfully"` (meta) | TENANT |
| GET | `/api/v1/application/owner-applications` | auth(OWNER, PROPERTY_MANAGER) | 200 `"Applications fetched successfully"` (meta) | OWNER (verified) or assigned MANAGER |
| GET | `/api/v1/application/:applicationId` | auth(TENANT, OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN) | 200 `"Application fetched successfully"` | Participant/owner/assigned manager/admin |
| PATCH | `/api/v1/application/:applicationId/review` | auth(OWNER, PROPERTY_MANAGER), validateRequest(ReviewApplicationZodSchema) | 200 `"Application reviewed successfully"` | OWNER or assigned MANAGER (of room) |
| POST | `/api/v1/application/:applicationId/pay-deposit` | auth(TENANT), validateRequest(PayDepositZodSchema) | 200 `"Payment session created successfully"` | TENANT (applicant) |
| POST | `/api/v1/application/:applicationId/cancel` | auth(TENANT, ADMIN, SUPER_ADMIN) | 200 `"Application cancelled successfully"` | Applicant or admin |

## Request/response contracts

**`ApplyForRoomZodSchema`**: `roomId` required (`"roomId is required"`); `moveInDate` required ISO offset datetime (`"moveInDate must be a valid date"`); `leaseMonths` int required min 1 (`"leaseMonths must be at least 1"`) max 60 (`"leaseMonths cannot exceed 60"`); `roommatePairId` optional; `message` string max 500 optional.

**`ReviewApplicationZodSchema`**: `status` enum `APPROVED` \| `REJECTED` (`"Status must be APPROVED or REJECTED"`); `rejectionReason` string optional with `superRefine` required when REJECTED (`"Rejection reason is required when rejecting an application"`).

**Query params** (both lists, raw): page=1, limit=10, optional `status`; `owner-applications` also optional `roomId`; order `createdAt desc`. No search/sort.

Response shapes:
- `apply` → created Application (PENDING).
- `my-applications` → rows with full `room` incl. `property { id, title, city, area, images }`, plus `lease` and `payment` (full or null).
- `owner-applications` → rows with `tenantProfile { id, name, email, contactNumber, occupation, user { imageUrl } }`, `room { id, name, monthlyRent }`, `lease`, `payment`.
- `:applicationId` → single with tenantProfile (incl. user), full room incl. property + owner `{ id, userId, name, companyName }`, `lease`, `payment`, `roommatePair` (with tenant A/B names) or null.
- `review`/`cancel` → the updated Application row.
- `pay-deposit` → `{ payment, paymentUrl }` (bKash session).

## Business rules

- `applyForRoom` (transaction) — tenant profile (404 `"Tenant profile not found"`); room must exist, `isDeleted: false, isPublished: true` (404 `"Room not found"`); room full → 409 `"Room is already fully occupied"`; `moveInDate` before `availableFrom` → 400 `` `Room is only available from ${availableFrom.toDateString()}` ``; `leaseMonths < minLeaseMonths` → 400 `` `Minimum lease term for this room is ${n} month(s)` ``; live duplicate (a PENDING/APPROVED application whose lease is null or still ACTIVE; an APPROVED application whose lease ended no longer blocks — a former tenant may re-apply) → 409 `"You already have a pending or approved application for this room"`; `roommatePairId` must include the caller → 400 `"Roommate pair is invalid for this tenant"`. Creates PENDING; notifies the property owner (`APPLICATION`, `"New rental application 📝"`).
- `getMyApplications` / `getOwnerApplications` — scoped lists (tenant by profile; OWNER by `room.property.ownerId`; PROPERTY_MANAGER by `room.property` matching `propertyManagerScope(user)`; optional roomId must fall inside the scope). 404 `"Tenant profile not found"` / `"Owner profile not found"` (a MANAGER without any assignment simply gets an empty list). **Manager responses are payment-blind**: the `payment` include is stripped from `owner-applications` rows and `:applicationId` detail for PROPERTY_MANAGER viewers (spec 17 money isolation).
- `getApplicationDetail` — 404 `"Application not found"`; access allowed to the applicant, the room's owner, an assigned manager, or ADMIN/SUPER_ADMIN else 403 `"You are not allowed to view this application"`.
- `reviewApplication` (transaction) — owner of the room or an assigned manager only (else 403 `"You are not the owner of this room"` — same shape as the legacy owner denial); must be PENDING else 409 `` `Application has already been ${status.toLowerCase()}` ``; REJECTED without reason → 400; APPROVED checks capacity: `room.occupiedBeds + countProspectiveBeds(roomId)` (other APPROVED-unleased applications) ≥ bedCount → 409 `"This room has no available bed left for another applicant"`. Writes status + `reviewedBy`/`reviewedAt` and the `APPLICATION_APPROVED`/`APPLICATION_REJECTED` audit entry atomically inside the transaction (actorRole recorded as OWNER or PROPERTY_MANAGER). Known soft race: the capacity check counts with the global client and the status update is not a conditional write, so two concurrent approvals of the last bed can both pass — accepted because the guarded bed increment at payment-callback time is the authoritative double-booking guard. After the transaction: email (`Your Application Was Approved!`/`Your Application Was Rejected`) and APPLICATION notification (`"Application approved 🎉"`/`"Application rejected"` — rejection reason comes from the review payload, including "not provided" when absent) to the tenant.
- `payDeposit` — tenant owns the application (403 `"You can only pay for your own applications"`); the caller's tenant profile must be **VERIFIED** (spec 03) else 403 `"Your tenant account is not verified yet. Please complete identity verification before paying"`; must be APPROVED else 409 `"Application must be approved before you can pay the booking deposit"`; no lease yet else 409 `"This application already has a lease"`; existing payment in PROCESSING/PAID/REFUND_PENDING/REFUNDED → 409 `"A payment for this application is already in progress or completed"`. Amount = `bookingDeposit` when > 0 else one month's rent. Calls `createBkashPayment` (callback `/payment/callback`), upserts the `Payment` row (purpose DEPOSIT, status PROCESSING) on unique `applicationId`, returns `{ payment, paymentUrl }`. Lease + bed increment only happen in the callback (spec 12).
- `cancelApplication` (transaction) — applicant or ADMIN/SUPER_ADMIN (else 403 `"You cannot cancel this application"`); must be PENDING or APPROVED else 409 `` `Application cannot be cancelled in ${status.toLowerCase()} status` ``; blocked if a PROCESSING/PAID/REFUND_PENDING/REFUNDED payment exists → 409 `"Application already has a paid/processing payment. Please contact the owner instead."`; sets CANCELLED + `reviewedBy` and the `APPLICATION_CANCELLED` audit entry atomically inside the transaction. No notification/email.

ApplicationStatus flow: `PENDING → APPROVED | REJECTED` (owner), `PENDING|APPROVED → CANCELLED` (tenant/admin), `PENDING → EXPIRED` (system: cron `expirePendingApplications` in `src/app/lib/cron.ts`, daily 00:20, auto-expires PENDING applications older than 14 days with an `APPLICATION_EXPIRED` audit entry, actor `SYSTEM`).

## Data model

`Application` (`applications`): id uuid, `moveInDate`, `leaseMonths` default 12, `message?`, `status` default PENDING (idx), `rejectionReason?`, `reviewedBy?`, `reviewedAt?`, soft-delete, timestamps; `tenantProfileId` (cascade, idx), `roomId` (cascade, idx), `roommatePairId?` → RoommatePair (`onDelete: SetNull`); 1:1 `payment?`, `lease?`. No schema changes required.

## Definition of done

- [ ] TENANT applies to a published room; duplicate live application → 409; capacity/term/date guards → 400/409; owner notified.
- [ ] Owner or assigned MANAGER sees per-room applications; reviews APPROVE (beds reserved prospectively) or REJECT (reason required) → audit + email + notification carrying the actual rejection reason; unassigned MANAGER → 403.
- [ ] Tenant opens deposit session on APPROVED application only → `{ payment, paymentUrl }`; second session while PROCESSING → 409; a not-yet-VERIFIED tenant → 403.
- [ ] Tenant cancels PENDING application → CANCELLED; cancel with paid deposit → 409.
- [ ] Detail access rules (applicant/owner/admin) enforced; others → 403.
- [ ] `lint:check`/`format:check`/`build` pass.
