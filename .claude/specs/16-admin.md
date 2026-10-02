# 16: Admin console

Priority: P0 (queues and audit logs for payments are P1) · Backend specs: 04 (owner verification), 05 (property admin), 12 (payment admin), 15 (admin) · Depends on: 01-foundation, 04-profile

## Goal
Admins see live platform statistics, manage users (block, unblock, change roles), review owner and tenant verifications, moderate properties, see all payments and resolve stuck refunds and settlements, and read the audit trail.

## Tech used
`DataTable` with URL-synced filters, Recharts, `@tanstack/react-form` + Zod for decision dialogs, `ConfirmDialog`, `StatCard`, JSON viewer for audit before and after values. Base stack: see 01-foundation.

## Roles
ADMIN and SUPER_ADMIN for everything here. **Role changes are SUPER_ADMIN only** (hide the control for ADMIN; the backend also enforces it).

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/admin` | Overview: platform stats, charts, pending queues | ADMIN, SUPER_ADMIN | Server with Client charts | P0 |
| `/admin/users` | User directory with filters; block, unblock; role change (SUPER_ADMIN) | ADMIN, SUPER_ADMIN | Server + Client | P0 |
| `/admin/verifications` | Tabs: Tenants (pending documents), Owners; approve or reject | ADMIN, SUPER_ADMIN | Server + Client | P0 |
| `/admin/properties` | All properties with filters; soft delete | ADMIN, SUPER_ADMIN | Server + Client | P0 |
| `/admin/payments` | Tabs: All payments (P0), Pending refunds (P1), Pending settlements (P1) | ADMIN, SUPER_ADMIN | Server + Client | P0 |
| `/admin/audit-logs` | Audit trail with filters | ADMIN, SUPER_ADMIN | Server + Client | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/admin/dashboard-stats` | ADMIN, SUPER_ADMIN | — | Live platform counters |
| GET | `/api/v1/admin/users` | ADMIN, SUPER_ADMIN | — | User directory (filters searchTerm, role, status) |
| PATCH | `/api/v1/admin/users/:userId/status` | ADMIN, SUPER_ADMIN | UpdateUserStatusZodSchema | Block or unblock |
| PATCH | `/api/v1/admin/users/:userId/role` | SUPER_ADMIN | UpdateUserRoleZodSchema | Change role (SUPER_ADMIN only) |
| GET | `/api/v1/admin/audit-logs` | ADMIN, SUPER_ADMIN | — | Audit trail (default limit 20) |
| GET | `/api/v1/admin/payments/pending-refunds` | ADMIN, SUPER_ADMIN | — | Payments stuck in REFUND_PENDING |
| POST | `/api/v1/admin/payments/pending-refunds/:paymentId/resolve` | ADMIN, SUPER_ADMIN | ResolvePendingRefundZodSchema | Record the refund outcome |
| GET | `/api/v1/admin/payments/pending-settlements` | ADMIN, SUPER_ADMIN | — | Stale PROCESSING payments needing review |
| POST | `/api/v1/admin/payments/pending-settlements/:paymentId/resolve` | ADMIN, SUPER_ADMIN | ResolvePendingSettlementZodSchema | Record the settlement outcome |
| GET | `/api/v1/admin/tenant-verifications` | ADMIN, SUPER_ADMIN | — | Pending tenant verifications with documents |
| PATCH | `/api/v1/admin/tenant-verifications/:tenantProfileId` | ADMIN, SUPER_ADMIN | ReviewTenantVerificationZodSchema | Approve or reject a tenant |
| GET | `/api/v1/owner/all-owners` | ADMIN, SUPER_ADMIN | — | Owners list (filters searchTerm, verificationStatus) |
| PATCH | `/api/v1/owner/verify` | ADMIN, SUPER_ADMIN | VerifyOwnerZodSchema | Approve or reject an owner |
| GET | `/api/v1/property/all` | ADMIN, SUPER_ADMIN | — | All properties (filters searchTerm, city, type, ownerId) |
| GET | `/api/v1/payment/all-payments` | ADMIN, SUPER_ADMIN | — | All payments (filters status, purpose) |

Also used here: `DELETE /api/v1/property/:propertyId` (owned by 05; admin soft delete) and `GET /api/v1/payment/:paymentId` (owned by 10; payment detail).

## Zod schemas
Source: backend `admin.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const UpdateUserStatusZodSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"], "Status must be ACTIVE or BLOCKED"),
  reason: z.string("Not a string.").optional(),
});

const UpdateUserRoleZodSchema = z.object({
  role: z.enum(
    ["TENANT", "OWNER", "PROPERTY_MANAGER", "ADMIN"],
    "Role must be TENANT, OWNER, PROPERTY_MANAGER or ADMIN",
  ),
  reason: z.string("Not a string.").optional(),
});

const ResolvePendingRefundZodSchema = z.object({
  outcome: z.enum(
    ["REFUNDED", "NOT_REFUNDED"],
    "Outcome must be REFUNDED or NOT_REFUNDED",
  ),
  refundTrxId: z.string("Not a string.").optional(),
  note: z.string("Not a string.").optional(),
});

const ResolvePendingSettlementZodSchema = z.object({
  outcome: z.enum(
    ["SETTLED", "NOT_SETTLED"],
    "Outcome must be SETTLED or NOT_SETTLED",
  ),
  providerTrxId: z.string("Not a string.").optional(),
  note: z.string("Not a string.").optional(),
});

const ReviewTenantVerificationZodSchema = z
  .object({
    verificationStatus: z.enum(
      ["APPROVED", "REJECTED"],
      "verificationStatus must be APPROVED or REJECTED",
    ),
    rejectionReason: z.string("Not a string.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.verificationStatus === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting a tenant",
      });
    }
  });
```

Source: backend `owner.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const VerifyOwnerZodSchema = z
  .object({
    ownerProfileId: z.string().min(1, "ownerProfileId is required"),
    verificationStatus: z.enum(
      ["APPROVED", "REJECTED"],
      "verificationStatus must be APPROVED or REJECTED",
    ),
    rejectionReason: z.string("Not a string.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.verificationStatus === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting an owner",
      });
    }
  });
```

## Data and state
- **Dashboard stats** keys: `totalUsers`, `totalTenants`, `totalOwners`, `totalManagers`, `totalAdmins`, `blockedUsers`, `pendingOwnerVerifications`, `pendingTenantVerifications`, `totalProperties`, `totalRooms`, `totalBeds`, `occupiedBeds`, `occupancyRate`, `totalApplications`, `pendingApplications`, `activeLeases`, `openMaintenanceRequests`, `totalRevenue` (sum of PAID payments; refunds are already netted out, never subtract again). Charts: users by role (bar), occupancy (radial), revenue (big number), pending queues as linked cards (owner and tenant verifications, pending applications, open maintenance).
- **Users**: query `page`, `limit`, `sortBy` (createdAt), `sortOrder` (desc), `searchTerm` (name or email), `role`, `status`. Rows show role, status, tenant or owner verification status, manager info, created date (password never present). Block or unblock has an optional reason; role change has an optional reason and offers TENANT, OWNER, PROPERTY_MANAGER, ADMIN only.
- **Verifications, tenants**: list is PENDING tenants with an uploaded document, oldest first; show the document (image preview or PDF link), applicant info; Approve, or Reject with a required reason. **Owners**: default filter `verificationStatus=PENDING`; rows include `_count.properties` and documents; verify body is `{ ownerProfileId, verificationStatus, rejectionReason? }`.
- **Properties**: filters `searchTerm`, `city`, `type`, `ownerId`; rows include owner `{ name, email, verificationStatus }` and `_count.rooms`; delete is a soft delete with confirmation.
- **Payments**: All payments filtered by `status` and `purpose`, rows include the tenant (via application or invoice lease), a detail drawer from `GET /payment/:paymentId`. Pending refunds list (oldest first) with a resolve dialog: outcome REFUNDED or NOT_REFUNDED, optional `refundTrxId`, optional note. Pending settlements list with a resolve dialog: outcome SETTLED or NOT_SETTLED, optional `providerTrxId`, optional note.
- **Audit logs**: filters `action` (substring), `entity`, `actorId`, `actorEmail`, default `limit=20`, newest first; each row expands to show `before` and `after` JSON, actor role, IP and user agent. Known actions include OWNER_APPROVED, TENANT_REJECTED, USER_BLOCKED, USER_ROLE_CHANGED, MANAGER_ASSIGNED, ROOM_UPDATED, APPLICATION_APPROVED, LEASE_TERMINATED, PAYMENT_REFUNDED, PENDING_REFUND_RESOLVED and more; use a free-text filter, not a fixed list.

## States
Skeleton tables; empty states per tab ("No pending verifications", "No refunds waiting"); error with retry; buttons disabled while a decision is pending.

## UX notes
- Admin overview cards link to the queue they describe.
- Destructive or irreversible actions (block, role change, reject, delete, resolve) use `ConfirmDialog` and show a success toast; after success refetch the list.
- Hide the role-change action for ADMIN; never show it for a SUPER_ADMIN row.
- Document previews open in a dialog; PDFs open in a new tab.

## Backend rules the UI must respect
- Block or unblock: cannot target yourself or a SUPER_ADMIN (400 "You cannot change the status of this account"); repeating the same status gives 409. DELETED cannot be set. A blocked user is rejected on their next request.
- Role change: SUPER_ADMIN only (403); cannot change your own role (400); same role gives 409; SUPER_ADMIN cannot be assigned. Missing profiles are auto-created (OWNER starts PENDING). Demotion keeps profiles.
- Tenant and owner reviews: only PENDING items can be reviewed (409 "...has already been X"); reject needs a reason (400). Approval or rejection emails and notifies the user.
- Pending refund resolve: only REFUND_PENDING (409 otherwise); a lost race gives 409 "Payment was already reconciled by another request"; NOT_REFUNDED restores PAID so termination can be retried; REFUNDED records the refund. Settlement resolve works the same: SETTLED runs the guarded settle, NOT_SETTLED sets FAILED (the tenant can retry); a double resolve gives 409.
- Admin delete of a property soft-deletes it; units and rooms are untouched.
- Audit logs are append-only and read-only.

## Acceptance checklist
- [ ] Overview shows all stats and linked queue cards with real data.
- [ ] Users table filters by search, role, status through the URL; block, unblock and role change work with the described guards; ADMIN does not see role change.
- [ ] Tenant and owner verifications approve and reject (reason required); a second review shows the 409 message.
- [ ] Properties list filters and soft delete work.
- [ ] All payments list filters by status and purpose and opens detail; refund and settlement queues resolve correctly (P1).
- [ ] Audit logs filter by action, entity, actor id and email; rows expand to before and after JSON.
- [ ] Every page is responsive with skeleton, empty and error states.

## Out of scope
Admin UI for leases, rooms or viewings (no admin list endpoints), exports, user deletion (not supported by the backend).
