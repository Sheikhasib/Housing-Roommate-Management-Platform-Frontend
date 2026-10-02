# Spec 15 — Admin Console (Users, Status, Roles, Audit)

## Overview

Platform administration for ADMIN/SUPER_ADMIN. Provides live platform-wide dashboard statistics, a searchable/filterable user directory, block/unblock, role reassignment (SUPER_ADMIN only, creates the matching role profile when missing), **tenant identity verification review**, and the read-only append-only audit log. Domain moderation lives in the owning modules but is admin-gated: owner verification (spec 04), property listing/removal (spec 05), room removal (spec 06). No soft-delete of users exists anywhere.

## Depends on

- `prisma/schema/user.prisma`, `tenant.prisma`, `owner.prisma`, `property.prisma`, `room.prisma`, `application.prisma`, `lease.prisma`, `invoice.prisma`, `payment.prisma`, `maintenance.prisma`, `audit.prisma`, `enums.prisma`
- `src/app/utils/audit.ts` (`writeAuditLog`)
- `src/app/module/admin/*`
- Mount: `/api/v1/admin` in `src/app/app.ts`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/admin/dashboard-stats` | auth(ADMIN, SUPER_ADMIN) | 200 `"Dashboard statistics fetched successfully"` | ADMIN/SUPER_ADMIN |
| GET | `/api/v1/admin/users` | auth(ADMIN, SUPER_ADMIN) | 200 `"Users fetched successfully"` (meta) | ADMIN/SUPER_ADMIN |
| PATCH | `/api/v1/admin/users/:userId/status` | auth(ADMIN, SUPER_ADMIN), validateRequest(UpdateUserStatusZodSchema) | 200 `"User status updated successfully"` | ADMIN/SUPER_ADMIN |
| PATCH | `/api/v1/admin/users/:userId/role` | auth(SUPER_ADMIN), validateRequest(UpdateUserRoleZodSchema) | 200 `"User role updated successfully"` | SUPER_ADMIN only |
| GET | `/api/v1/admin/audit-logs` | auth(ADMIN, SUPER_ADMIN) | 200 `"Audit logs fetched successfully"` (meta) | ADMIN/SUPER_ADMIN |
| GET | `/api/v1/admin/payments/pending-refunds` | auth(ADMIN, SUPER_ADMIN) | 200 `"Pending refund payments fetched successfully"` (meta) | ADMIN/SUPER_ADMIN |
| POST | `/api/v1/admin/payments/pending-refunds/:paymentId/resolve` | auth(ADMIN, SUPER_ADMIN), validateRequest(ResolvePendingRefundZodSchema) | 200 `"Pending refund resolved successfully"` | ADMIN/SUPER_ADMIN |
| GET | `/api/v1/admin/payments/pending-settlements` | auth(ADMIN, SUPER_ADMIN) | 200 `"Pending settlement payments fetched successfully"` (meta) | ADMIN/SUPER_ADMIN |
| POST | `/api/v1/admin/payments/pending-settlements/:paymentId/resolve` | auth(ADMIN, SUPER_ADMIN), validateRequest(ResolvePendingSettlementZodSchema) | 200 `"Pending settlement resolved successfully"` | ADMIN/SUPER_ADMIN |
| GET | `/api/v1/admin/tenant-verifications` | auth(ADMIN, SUPER_ADMIN) | 200 `"Pending tenant verifications fetched successfully"` (meta) | ADMIN/SUPER_ADMIN |
| PATCH | `/api/v1/admin/tenant-verifications/:tenantProfileId` | auth(ADMIN, SUPER_ADMIN), validateRequest(ReviewTenantVerificationZodSchema) | 200 `"Tenant verification reviewed successfully"` | ADMIN/SUPER_ADMIN |

## Request/response contracts

**`UpdateUserStatusZodSchema`**: `status` enum `ACTIVE` \| `BLOCKED` (`"Status must be ACTIVE or BLOCKED"` — DELETED cannot be set), `reason` optional string. Not strict.

**`UpdateUserRoleZodSchema`**: `role` enum `TENANT` \| `OWNER` \| `PROPERTY_MANAGER` \| `ADMIN` (`"Role must be TENANT, OWNER, PROPERTY_MANAGER or ADMIN"` — SUPER_ADMIN cannot be assigned), `reason` optional string. Not strict.

**`ResolvePendingRefundZodSchema`**: `outcome` enum `REFUNDED` \| `NOT_REFUNDED` (`"Outcome must be REFUNDED or NOT_REFUNDED"`), `refundTrxId` optional string, `note` optional string. Not strict.

**`ResolvePendingSettlementZodSchema`** (spec 12): `outcome` enum `SETTLED` \| `NOT_SETTLED` (`"Outcome must be SETTLED or NOT_SETTLED"`), `providerTrxId` optional string, `note` optional string. Not strict.

**`ReviewTenantVerificationZodSchema`**: `verificationStatus` enum `APPROVED` \| `REJECTED` (`"verificationStatus must be APPROVED or REJECTED"` — PENDING not accepted), `rejectionReason` optional string with `superRefine`: required when REJECTED (`"Rejection reason is required when rejecting a tenant"`). Not strict.

**`users`** query (raw `IQuery`): page=1, limit=10, sortBy=createdAt, sortOrder=desc; base filter `isDeleted: false`; `searchTerm` (OR contains-insensitive on `name`, `email`); `role` (exact Role enum); `status` (exact UserStatus). Response rows (password omitted) include `tenantProfile { id, preferredCity, lookingForRoommate, occupation, verificationStatus }`, `ownerProfile { id, verificationStatus, companyName }`, `managerProfile { id, contactNumber, bio }`, `_count: { notifications }`.

**`tenant-verifications`** query: page=1, limit=10; base filter `{ verificationStatus: PENDING, verificationDocUrl: { not: null }, isDeleted: false }`; optional `searchTerm` (contains-insensitive OR on profile `name`, `email`); order `createdAt asc` (oldest first). Response rows: `TenantProfile` (verification fields incl. `verificationDocUrl`) + nested `user { id, name, email, role, status, imageUrl, createdAt }`; `meta` present.

**`audit-logs`** query: page=1, limit=**20**; filters (AND): `action` (substring contains-insensitive), `entity` (case-insensitive equality), `actorId` (equality), `actorEmail` (contains-insensitive); order `createdAt desc`. Response rows are `AuditLog` records.

**`dashboard-stats`**: no params; `data` keys documented below.

## Business rules

- `getAdminDashboardStats` — live counts: `totalUsers`, `totalTenants`, `totalOwners`, `totalManagers`, `totalAdmins` (ADMIN+SUPER_ADMIN), `blockedUsers`, `pendingOwnerVerifications`, `pendingTenantVerifications`, `totalProperties`, `totalRooms`, `totalBeds`, `occupiedBeds`, `occupancyRate` (`round(occupied/total×100)` or 0), `totalApplications`, `pendingApplications`, `activeLeases`, `openMaintenanceRequests` (OPEN/ASSIGNED/IN_PROGRESS), `totalRevenue` (= Σ PAID payments; refunded deposits have already left PAID for REFUNDED/REFUND_PENDING, so they are netted out automatically — never subtract REFUNDED again). Non-deleted rows only where the model supports soft delete.
- `getAllUsers` — paginated directory as above (no errors thrown).
- `updateUserStatus` — guards in order: target missing/deleted → 404 `"User not found"`; self or SUPER_ADMIN target → 400 `"You cannot change the status of this account"`; same status → 409 `` `User is already ${status.toLowerCase()}` ``. Writes status; `writeAuditLog("USER_BLOCKED"/"USER_UNBLOCKED", before/after incl. reason)`. No notification/email to the target. Blocked users are rejected by `auth` on their next request (403).
- `updateUserRole` — SUPER_ADMIN only (route + service 403 `"Only a super admin can change user roles"`); target missing → 404 `"User not found"`; self → 400 `"You cannot change your own role"`; already that role → 409 `"User already has this role"`. Transaction: update `User.role`, then if the target role profile is missing create it (OWNER created with `verificationStatus: PENDING`; PROPERTY_MANAGER created via `ManagerProfile`); demotion never deletes profiles. `writeAuditLog("USER_ROLE_CHANGED", before/after)`. No notification/email.
- `getAuditLogs` — filtered, paginated trail; no date-range filter.
- `getPendingTenantVerifications` — PENDING tenant profiles with an uploaded doc, oldest first, as above.
- `reviewTenantVerification` — tenant profile missing/deleted → 404 `"Tenant profile not found"`; not PENDING → 409 `` `Tenant verification has already been ${status.toLowerCase()}` `` (no idempotent re-review); REJECTED without reason → 400. Sets `verificationStatus`, `rejectionReason` (cleared to null on APPROVE), `reviewedBy` = reviewer userId, `reviewedAt` = now; `writeAuditLog("TENANT_APPROVED"/"TENANT_REJECTED")`; email (`Your Tenant Account Has Been Approved`/`Rejected`, templates `tenant-account-approved`/`tenant-account-rejected`); SYSTEM notification to the tenant. Once APPROVED the tenant can start payment sessions (specs 09/11).
- `getPendingRefundPayments` — lists payments stuck in REFUND_PENDING (bKash refund outcome could not be determined — see the termination saga in spec 10). Paginated, oldest first (`updatedAt asc`), including the application's tenant profile and lease status. Admins verify the actual outcome in the bKash merchant portal (the tokenized-checkout API offers no refund-status query).
- `resolvePendingRefundPayment` — payment missing → 404 `"Payment not found"`; not REFUND_PENDING → 409 `` `Payment is not awaiting refund reconciliation (status: ${status.toLowerCase()})` ``. Guarded transaction (conditional `updateMany` keyed on REFUND_PENDING; a lost race → 409 `"Payment was already reconciled by another request"`): `outcome: "REFUNDED"` records the completed refund (`refundTrxId` from payload/portal, `refundAt`, `refundAmount`, `refundReason` from `note`) — a still-ACTIVE lease can then be terminated again without a second refund; `outcome: "NOT_REFUNDED"` restores PAID so the tenant may retry the termination. Writes a `PENDING_REFUND_RESOLVED` audit entry atomically and notifies the tenant (PAYMENT).

Cross-domain admin actions (gated routes): `PATCH /api/v1/owner/verify` (approve/reject → audit + email + SYSTEM notification, spec 04); `GET /api/v1/owner/all-owners`; `GET /api/v1/property/all` + `DELETE /api/v1/property/:propertyId` (admin soft-deletes any property, spec 05); `DELETE /api/v1/room/:roomId` (in practice owner-only, spec 06). Owner verification workflow detail lives in spec 04; tenant verification: the document upload lives in spec 03, the review endpoints live here (audit `TENANT_APPROVED`/`TENANT_REJECTED` + email + SYSTEM notification, mirroring the owner flow).

## Data model

`AuditLog` (`audit_logs`): id uuid, `action`, `entity`, `entityId?`, `actorId?`, `actorEmail?`, `actorRole?`, `before Json?`, `after Json?`, `ipAddress?`, `userAgent?`, `createdAt` only (append-only; no FK relations; indexes entity/actorId/createdAt). Actions seen: `OWNER_APPROVED`, `OWNER_REJECTED`, `TENANT_APPROVED`, `TENANT_REJECTED`, `USER_BLOCKED`, `USER_UNBLOCKED`, `USER_ROLE_CHANGED`, `MANAGER_ASSIGNED`, `MANAGER_REMOVED`, `ROOM_UPDATED`, `ROOM_AVAILABILITY_UPDATED`, `PROPERTY_UPDATED`, `UTILITY_BILL_CREATED`, `MEMBERSHIP_INVITED`, `MEMBERSHIP_ACCEPTED`, `MEMBERSHIP_DECLINED`, `MEMBERSHIP_REMOVED`, `APPLICATION_APPROVED`, `APPLICATION_REJECTED`, `APPLICATION_CANCELLED`, `APPLICATION_EXPIRED`, `VIEWING_STATUS_UPDATED`, `VIEWING_CANCELLED`, `LEASE_TERMINATED`, `LEASE_COMPLETED`, `PAYMENT_REFUNDED`, `REFUND_OUTCOME_UNKNOWN`, `PENDING_REFUND_RESOLVED`, `MAINTENANCE_STATUS_UPDATED`. No schema changes required.

## Definition of done

- [ ] ADMIN sees dashboard stats (incl. `pendingTenantVerifications`/`totalManagers`); SUPER_ADMIN promotes a TENANT to OWNER (profile auto-created PENDING), to PROPERTY_MANAGER (manager profile auto-created), and to ADMIN.
- [ ] Blocking a user takes effect on their next request (403); blocking self or SUPER_ADMIN → 400; repeated status → 409.
- [ ] `users` list filters by searchTerm/role/status and never exposes `password`.
- [ ] Every admin mutation writes an audit log visible under `audit-logs` filters.
- [ ] Pending-refund queue lists REFUND_PENDING payments; resolve as NOT_REFUNDED → PAID (termination retryable); resolve as REFUNDED → REFUNDED (retry terminates with `refund: null`); double-resolve → 409.
- [ ] Tenant verification: pending list shows only PENDING tenants with a doc; APPROVE/REJECT → audit + email + notification; reject without reason → 400; double-review → 409; APPROVED tenant can start payments (specs 09/11).
- [ ] SUPER_ADMIN cannot be assigned via role endpoint (400 validation); `lint:check`/`format:check`/`build` pass.
