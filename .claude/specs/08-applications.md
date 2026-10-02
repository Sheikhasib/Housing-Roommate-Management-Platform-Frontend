# 08: Rental applications and deposit

Priority: P0 · Backend specs: 09 (application) · Depends on: 01-foundation, 03-public-rooms, 04-profile, 10-invoices-payments (payment return)

## Goal
Tenants apply for a published room, follow the application, and once approved pay the booking deposit through a gateway (which creates the lease). Owners and assigned managers review applications: approve (capacity-checked) or reject with a reason.

## Tech used
`@tanstack/react-form` + Zod for the apply dialog and the review dialog, a Server Action for payment start (`startPaymentAction`) with `redirect()` to the gateway, shared `GatewayPicker` (from `GET /payment/gateways`), TanStack Query with URL filters. Base stack: see 01-foundation.

## Roles
TENANT (apply, list own, detail, pay deposit, cancel). OWNER and PROPERTY_MANAGER (list for their rooms, detail, review; managers never see payment data). ADMIN may cancel through the API but has no UI here.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/dashboard/applications` | My applications with status filter and actions | TENANT | Server + Client | P0 |
| `/dashboard/applications/[applicationId]` | Application detail with status timeline, deposit action | TENANT | Server + Client | P1 |
| `/owner/applications` | Applications for my rooms with status and room filters | OWNER, PROPERTY_MANAGER | Server + Client | P0 |
| `/owner/applications/[applicationId]` | Detail with applicant info and review actions | OWNER, PROPERTY_MANAGER | Server + Client | P1 |
| (dialog) `ApplyDialog` | Opened from `/rooms/[roomId]` | TENANT | Client | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| POST | `/api/v1/application/apply` | TENANT | ApplyForRoomZodSchema | Submit an application (creates PENDING) |
| GET | `/api/v1/application/my-applications` | TENANT | — | Tenant's applications with room, property, lease and payment |
| GET | `/api/v1/application/owner-applications` | OWNER, PROPERTY_MANAGER | — | Applications for the owner's or manager's rooms |
| GET | `/api/v1/application/:applicationId` | TENANT, OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN | — | Application detail (applicant, room owner, assigned manager, admin) |
| PATCH | `/api/v1/application/:applicationId/review` | OWNER, PROPERTY_MANAGER | ReviewApplicationZodSchema | Approve or reject (owner or assigned manager) |
| POST | `/api/v1/application/:applicationId/pay-deposit` | TENANT | PayDepositZodSchema | Opens a payment session, returns `{ payment, paymentUrl }` |
| POST | `/api/v1/application/:applicationId/cancel` | TENANT, ADMIN, SUPER_ADMIN | — | Cancel while PENDING or APPROVED |

Also used here: `GET /api/v1/payment/gateways` (owned by 10) and, from P1, `GET /api/v1/roommate/my-pairs` (owned by 13) for the optional roommate pair.

## Zod schemas
Source: backend `application.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const ApplyForRoomZodSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  moveInDate: z
    .string("Not a string.")
    .datetime({ offset: true, message: "moveInDate must be a valid date" }),
  leaseMonths: z
    .number("leaseMonths must be a number.")
    .int("leaseMonths must be an integer.")
    .min(1, "leaseMonths must be at least 1")
    .max(60, "leaseMonths cannot exceed 60"),
  roommatePairId: z.string().optional(),
  message: z
    .string("Not a string.")
    .max(500, "Message must be at most 500 characters")
    .optional(),
});

const ReviewApplicationZodSchema = z
  .object({
    status: z.enum(
      ["APPROVED", "REJECTED"],
      "Status must be APPROVED or REJECTED",
    ),
    rejectionReason: z.string("Not a string.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting an application",
      });
    }
  });

const PayDepositZodSchema = z.object({
  gateway: z
    .enum(["bkash", "sslcommerz", "stripe"], "Unsupported payment gateway")
    .default("bkash"),
});
```

Notes: `PayDepositZodSchema.gateway` is lowercase (`bkash`, `sslcommerz`, `stripe`) and defaults to `bkash`. On the first real call confirm that `data.paymentUrl` is a plain URL string and adapt the Server Action if it is nested.

## Data and state
- Lists accept `page`, `limit`, `status`; the owner list also accepts `roomId`. Newest first. Keep filters in the URL.
- Tenant rows include the full room with `property { id, title, city, area, images }`, `lease` and `payment` (or null). Owner rows include `tenantProfile { id, name, email, contactNumber, occupation, user { imageUrl } }`, `room { id, name, monthlyRent }`, `lease`, `payment`.
- **Manager responses have no `payment` key.** Types must make `payment` optional and the UI must hide payment sections when absent.
- Deposit amount shown to the tenant: the room's `bookingDeposit` when greater than 0, otherwise one month's rent.
- **Pay deposit action** (`startPaymentAction({ kind: "deposit", id, gateway })`): calls `POST /application/:id/pay-deposit`, then `redirect(paymentUrl)`. It runs only when: status APPROVED, `lease` is null, no payment in PROCESSING, PAID, REFUND_PENDING or REFUNDED, and the tenant's `verificationStatus` is APPROVED. Otherwise the button is disabled with the reason.
- Status timeline for the tenant: Submitted, Approved, Deposit paid, Lease active.

## States
Skeleton list; empty states ("You have not applied to any room yet" with a link to `/rooms`; "No applications for your rooms"); inline disabled reasons for the pay button; error with retry. EXPIRED shows a neutral badge and an "Apply again" link to the room.

## UX notes
- Apply dialog fields: move-in date (not before the room's `availableFrom` when set), lease months (minimum from the room's `minLeaseMonths`, maximum 60), optional message (500), optional roommate pair select (P1). Validate with `ApplyForRoomZodSchema` plus the room-specific minimums.
- Review dialog: Approve (confirm), Reject (reason required). After approval show "The tenant can now pay the deposit; a lease is created when the payment succeeds."
- Payment start opens `GatewayPicker`; show amount and gateway notes before redirect.
- Cancel asks for confirmation; if a payment exists the backend refuses and the message is shown.
- Info text: "Applications expire after 14 days without a decision."

## Backend rules the UI must respect
- Apply guards: room must be published (404), fully occupied gives 409 "Room is already fully occupied", move-in before `availableFrom` gives 400 "Room is only available from <date>", lease months below the room minimum give 400, a live duplicate gives 409 "You already have a pending or approved application for this room", an invalid roommate pair gives 400.
- Review: only PENDING can be reviewed (409 otherwise); APPROVE can fail with 409 "This room has no available bed left for another applicant"; REJECT needs a reason. Approval does not create a lease, invoice or room reservation.
- Deposit: only the applicant can pay (403); an unverified tenant gets 403 "Your tenant account is not verified yet. Please complete identity verification before paying"; a non-approved application gives 409; an existing lease gives 409; an in-progress or completed payment gives 409.
- Cancel: PENDING or APPROVED only; blocked once a paid or processing payment exists (409 "...contact the owner instead").
- Status flow: PENDING to APPROVED or REJECTED (owner or manager); PENDING or APPROVED to CANCELLED (tenant or admin); PENDING to EXPIRED (system, after 14 days).
- Managers see applications only for assigned properties; an unassigned manager sees an empty list and gets 403 on review.

## Acceptance checklist
- [ ] Tenant applies from a room page; every guard message shows verbatim.
- [ ] Owner and assigned manager list, open and review applications; rejection reason is required.
- [ ] Manager screens never show payment data and do not break when `payment` is absent.
- [ ] Approved application shows a working deposit button; an unverified tenant sees it disabled with the reason.
- [ ] Deposit start redirects to the chosen gateway; the return is handled by 10-invoices-payments.
- [ ] Cancel works for PENDING and APPROVED and is refused after payment.
- [ ] Filters and pagination persist in the URL.

## Out of scope
Lease creation (backend, on payment success), refunds (09-leases and 16-admin), application messaging.
