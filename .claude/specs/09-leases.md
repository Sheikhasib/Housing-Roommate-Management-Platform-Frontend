# 09: Leases

Priority: P0 · Backend specs: 10 (lease) · Depends on: 01-foundation, 08-applications, 10-invoices-payments

## Goal
Tenants and owners see leases, their invoices and documents, upload and manage documents, and terminate an active lease (with a clear deposit-refund explanation). Assigned managers get a read-only view.

## Tech used
`@tanstack/react-form` + Zod for the termination reason, `FileUploader` with `uploadWithProgress` for documents, `ConfirmDialog`, TanStack Query with URL filters. Base stack: see 01-foundation.

## Roles
TENANT (own leases: list, detail, upload document, terminate). OWNER (own rooms' leases: list, detail, upload and delete documents, terminate). PROPERTY_MANAGER (list and detail only, view-only, no payment data). ADMIN has API access to detail, terminate and documents but no UI here.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/dashboard/leases` | My leases with status filter | TENANT | Server + Client | P0 |
| `/dashboard/leases/[leaseId]` | Lease detail: terms, invoices, documents, terminate | TENANT | Server + Client | P0 |
| `/owner/leases` | Leases for my rooms with status and room filters | OWNER, PROPERTY_MANAGER | Server + Client | P0 |
| `/owner/leases/[leaseId]` | Lease detail: tenant, invoices, documents, terminate (owner only) | OWNER, PROPERTY_MANAGER | Server + Client | P1 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/lease/my-leases` | TENANT | — | Tenant's leases with room, invoices, documents, application |
| GET | `/api/v1/lease/owner-leases` | OWNER, PROPERTY_MANAGER | — | Leases for the owner's or manager's rooms |
| GET | `/api/v1/lease/:leaseId` | TENANT, OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN | — | Lease detail (participant, owner, assigned manager, admin) |
| POST | `/api/v1/lease/:leaseId/terminate` | TENANT, OWNER, ADMIN, SUPER_ADMIN | TerminateLeaseZodSchema | Terminate an active lease, returns `{ lease, refund }` |
| POST | `/api/v1/lease/:leaseId/documents` | TENANT, OWNER, ADMIN, SUPER_ADMIN | multipart single("document") | Upload a lease document |
| DELETE | `/api/v1/lease/:leaseId/documents/:documentId` | OWNER, ADMIN, SUPER_ADMIN | — | Remove a document (owner or admin) |

## Zod schemas
Source: backend `lease.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const TerminateLeaseZodSchema = z.object({
  reason: z
    .string("Not a string.")
    .min(3, "Reason must be at least 3 characters long")
    .max(300, "Reason must be at most 300 characters"),
});
```

Notes: document upload is `multipart/form-data` with field `document` (one file, image or PDF, 8 MB) and an optional text field `name` (the backend defaults to "rental-agreement").

## Data and state
- Lists accept `page`, `limit`, `status`; the owner list also accepts `roomId`. Newest first.
- Tenant list rows include the room with property, `invoices[]`, `documents[]`, `application` with `payment`. Owner rows include `tenantProfile`, `room`, `invoices`, `application`. **Manager responses omit `application.payment`.**
- Detail includes tenant profile with user, room with property and owner, invoices (newest period first), documents `{ id, name, url, publicId?, description? }`, application with payment.
- Termination result `{ lease, refund: { status: "REFUNDED", refundTrxId } | null }`: show a result panel ("Lease terminated. Deposit refunded: <trx>" or "No refund applies").
- Lease statuses: ACTIVE, COMPLETED (system, after the end date), TERMINATED.

## States
Skeleton; empty states ("No leases yet. A lease is created when your deposit payment succeeds"; "No leases for your rooms"); error with retry; document upload progress; disabled terminate button with tooltip when the lease is not ACTIVE or the viewer is a manager.

## UX notes
- Termination dialog: required reason (3 to 300 characters). Before confirming show: "If the lease has not started and the deposit was paid, the deposit is refunded to the original gateway. bKash and Stripe refunds are automatic; SSLCommerz deposits are refunded manually by an admin. Unpaid invoices are cancelled. Any roommate member is removed."
- Invoices table inside the detail links each unpaid invoice to `/dashboard/invoices` (tenant).
- Documents: list with name and link; tenant and owner can upload; only the owner can delete (confirm).
- Manager view shows terms, tenant name and contact, invoices and documents list, but no terminate, upload or delete controls and no payment details.

## Backend rules the UI must respect
- Leases are created only by a successful deposit payment; there is no create form.
- Terminate: ACTIVE only (409 "Lease is already X"); managers cannot terminate or manage documents (403). The refund runs as a guarded saga: a refund already in progress gives 409 "A deposit refund for this lease is already in progress. Please wait for it to be reconciled."; an unknown gateway outcome gives 502 and the refund is held for an admin; a lost race gives 409 "Lease is no longer active. Termination aborted." Show these verbatim and refetch.
- Termination frees a bed, cancels UNPAID and PROCESSING invoices and closes live roommate memberships.
- Document removal deletes only the database row (owner or admin). Tenants cannot delete documents.
- Access: tenant (own), owner (room's property owner), assigned manager (view-only), admin; others get 403.

## Acceptance checklist
- [ ] Tenant and owner list leases with filters in the URL and open details.
- [ ] Tenant and owner upload documents with preview and progress; only the owner can delete.
- [ ] Terminating shows the refund explanation and the result; edge-case 409 and 502 messages display verbatim.
- [ ] Manager sees view-only screens with no payment data and no write controls.
- [ ] After termination the lease shows TERMINATED and its unpaid invoices show CANCELLED.

## Out of scope
Lease creation, renewal, e-signatures, admin refund queues (16-admin).
