# Spec 00 — Platform Overview & Conventions

## Overview

Housing & Roommate Management Platform is a REST API backend for renting rooms and finding roommates in shared housing. It connects five actor roles through a single application lifecycle:

- **TENANT** — searches/browses published rooms, requests viewings, applies to rent, verifies their identity with admins, pays booking deposits and monthly invoices via bKash, manages roommate requests/matches, and reports maintenance.
- **OWNER** — verifies their identity with admins, creates properties/units/rooms, manages availability, reviews applications, schedules viewings, assigns leases, bills utilities, resolves maintenance.
- **PROPERTY_MANAGER** — an operator delegated by a verified OWNER to run day-to-day management of a specific property: responds to viewings, reviews applications, manages maintenance and utility bills, adjusts room availability, and views leases. Managers hold **OPERATE**-tier rights only — they never touch money (no payments/refunds/lease termination), never create or delete property/rooms, and never assign managers (see spec 17).
- **ADMIN / SUPER_ADMIN** — platform moderation: user directory, block/unblock, role assignment (SUPER_ADMIN only), owner + tenant verification, dashboard statistics, audit-log inspection.

Money is moved only through **bKash tokenized checkout** (deposit on lease creation; RENT/UTILITY invoice payments; conditional deposit refunds on early termination). The system enforces roles with Bearer/cookie JWTs, per-role middleware, verified-owner guards, property-level capability checks for managers, soft deletes, database transactions for money/occupancy flows, audit logs for critical actions, Redis caching for hot reads/OTPs/bKash tokens, and rate limiting + security headers.

## Architecture

- **Runtime:** Node.js, Express 5, TypeScript (`type: "module"`), ESM. Bootstrap: `src/server.ts`.
- **Database:** PostgreSQL via Prisma 7 (`@prisma/adapter-pg` driver adapter), schema in `prisma/schema/*.prisma`, client generated to `src/generated/prisma` (never hand-edit).
- **Validation:** Zod v4 (`validateRequest` middleware).
- **Lint/format:** Biome (`biome.json`: tabs, double quotes; excludes `src/generated`, `src/app/templates`).
- **Auth:** email/password (bcrypt) + email OTP verification + Google OAuth (`google-auth-library`), JWT access/refresh tokens in httpOnly cookies.
- **Cache/state:** Redis (`node-redis`) — auth OTPs, bKash tokens, public room search, roommate matches. Fail-soft everywhere except OTP flows.
- **Payments:** multi-gateway via `src/app/lib/payments/` adapters (bKash Tokenized Checkout, SSLCommerz, Stripe) — native `fetch`/`axios`/`stripe` SDK respectively; one shared settle path; SSLCommerz and Stripe notify routes are mounted before the JSON parsers and the rate limiter (`/payment/confirm`, `/payment/ipn` form-encoded; `/payment/webhook/stripe` raw-body).
- **Uploads:** multer (memory storage) + Cloudinary.
- **Email:** Nodemailer (Gmail SMTP) rendering `.ejs` templates; PDF receipts via pdfkit.
- **Background jobs:** node-cron (rent invoice generation, lease finalization, application expiry).

## Repository layout

```
src/
  app.ts                      Express app + route mounting
  server.ts                   boot: db → redis → email → seeds → cron → listen
  app/
    config/index.ts           env mapping
    interfaces/index.ts       IQuery (searchTerm/page/limit/sortBy/sortOrder + filters)
    middleware/               checkAuth, validateRequest, globalErrorHandler, notFound
    utils/                    AppError, catchAsync, sendResponse, jwt, audit, notification,
                              email, roomStatus, ownerGuard, propertyAccess, cloudinaryUpload, seed
    lib/                      prisma, redis, bKash, cloudinary, multer, rateLimiter,
                              nodemailer, cron, googleAuth
    templates/*.ejs           transactional email templates
    module/<domain>/          per-domain 5-file modules (see conventions)
prisma/schema/*.prisma        models split by domain + enums
prisma/migrations/            SQL migrations
```

## Request pipeline (`src/app/app.ts`)

Order matters:

1. `helmet()` security headers.
2. `cors({ origin: config.frontend_url, credentials: true })`.
3. `express.urlencoded({ extended: true })` → `express.json()` → `cookieParser()`.
4. `GET /` — welcome JSON (registered before the rate limiter → not limited).
5. `GET /api/v1/health` — `{ success, statusCode: 200, message: "Server is healthy", data: null }` (not limited).
6. `app.use("/api/v1", generalRateLimiter)` — applies to all route groups registered after it.
7. Mounted route groups (all under `/api/v1`): `auth, user, tenant, owner, property, room, viewing, roommate, application, lease, invoice, payment, maintenance, notification, manager, admin, analytics`.
8. `globalErrorHandler` then `notFound` (must be last).

## Auth & token transport

- `auth(...roles)` reads the access token from `req.cookies.accessToken`, else `Authorization: Bearer <token>`, else raw `Authorization`.
- JWT payload: `{ userId, name, email, role }`; verified against `JWT_ACCESS_SECRET`; then a DB re-check on `{ id, email, name, role }`.
- Guards: no token → 401 `"You are not logged in. Please log in to access this resource."`; invalid token → 401; role not allowed → 403 `"Forbidden. You don't have permission to access this resource."`; user mismatch → 401 `"User not found. Please log in again."`; BLOCKED → 403 `"Your account has been blocked. Please contact support."`; soft-deleted → 401 `"Your account has been deleted."`.
- On success sets `req.user = { email, name, userId, role }`.
- Tokens set as httpOnly cookies: `accessToken` maxAge 24h, `refreshToken` maxAge 7d, `secure` in production, `sameSite: "none"`; cleared on logout.

## Response & error contracts

Success (via `sendResponse`):

```json
{ "success": true, "statusCode": 200, "message": "…", "data": … }
```

Paginated lists add: `"meta": { "page", "limit", "total", "totalPages" }`.

Error (via `globalErrorHandler`):

```json
{ "success": false, "statusCode": …, "message": "…", "errors": [{ "field": "…", "message": "…" }], "name": "…", "stack": "…(dev only)" }
```

- Validation: `AppError(400, firstIssueMessage, "", issues)` with `issues = [{ field, message }]` per failed zod field.
- Prisma mapping: `P2002` → 409 `"Duplicate Key Error"`; `P2003` → 400 `"Foreign key constraint failed"`; `P2025` → 404; validation → 400 `"You have provided incorrect field type or missing fields"`; init `P1000` → 401 / `P1001` → 400; unknown → 500.
- In non-development environments the top-level `message` is masked to `"Something went wrong"`; `errors[].message` retains the real text.
- 404 route: `"Route not found"` with `errors: [{ message: "Cannot find <METHOD> <path>" }]`.

## Global enums (Prisma `enums.prisma`)

- `Role`: SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT
- `UserStatus`: ACTIVE, BLOCKED, DELETED
- `Gender`: MALE, FEMALE, OTHER
- `AuthProvider`: GOOGLE, CREDENTIAL
- `VerificationStatus`: PENDING, APPROVED, REJECTED (shared by `OwnerProfile` and `TenantProfile`; formerly `OwnerVerificationStatus`)
- `PropertyType`: APARTMENT, HOSTEL, DORMITORY, VILLA, SHARED_HOUSE, OTHER
- `RoomType`: PRIVATE_ROOM, SHARED_ROOM, ENTIRE_FLAT, BED
- `RoomStatus`: AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE
- `ApplicationStatus`: PENDING, APPROVED, REJECTED, CANCELLED, EXPIRED
- `ViewingStatus`: PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED
- `ViewingTimeSlot`: MORNING, AFTERNOON, EVENING
- `RoommateRequestStatus`: PENDING, ACCEPTED, DECLINED
- `MembershipStatus`: PENDING, ACTIVE, REJECTED, REMOVED (post-lease roommate memberships, spec 08)
- `LeaseStatus`: ACTIVE, COMPLETED, TERMINATED
- `PaymentStatus`: UNPAID, PROCESSING, PAID, FAILED, CANCELLED, REFUNDED
- `PaymentPurpose`: DEPOSIT, RENT, UTILITY
- `PaymentGateway`: BKASH, SSLCOMMERZ, STRIPE (spec 12)
- `InvoiceType`: RENT, UTILITY
- `InvoiceStatus`: UNPAID, PROCESSING, PAID, FAILED, CANCELLED, REFUNDED
- `MaintenanceStatus`: OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
- `MaintenancePriority`: LOW, MEDIUM, HIGH, URGENT
- `MaintenanceCategory`: PLUMBING, ELECTRICAL, APPLIANCE, FURNITURE, PAINTING, CLEANING, OTHER
- `NotificationType`: APPLICATION, VIEWING, PAYMENT, LEASE, MAINTENANCE, INVOICE, ROOMMATE, SYSTEM

## Data model overview (20 models)

`User` → 1:1 `TenantProfile`/`OwnerProfile`/`ManagerProfile`, 1:N `Notification`. `OwnerProfile` → 1:N `Property` → `Unit` (optional) and `Room`; a `Property` may have many assigned `ManagerProfile`s through the `PropertyManager` join (spec 17). `Room` → `ViewingRequest`, `Application`, `Lease`, `Invoice`, `MaintenanceRequest`. `Application` → 1:1 `Payment`/`Lease`, optional `RoommatePair`. `Lease` → `LeaseDocument`, `Invoice`, `MaintenanceRequest`, and at most one live `RoommateMembership` (an invited VERIFIED tenant sharing the holder's bed; people, not occupancy — spec 08). `Invoice` → 1:1 `Payment`. `AuditLog` is a standalone append-only table. Rooms track occupancy by integer bed counts (`bedCount`, `occupiedBeds`) — there is no `Bed` row; each active lease occupies one bed. Shared rooms host multiple simultaneous leases. `TenantProfile` carries identity-verification fields (`verificationStatus`, doc URLs, review trail) mirroring `OwnerProfile` (spec 03).

Refer to each module spec (`01`–`17`) for field-level detail.

## Conventions

- **IDs:** `String @default(uuid())`; exceptions: `TenantProfile` uuid(7), `OwnerProfile` cuid.
- **Timestamps:** `createdAt @default(now())` + `updatedAt @updatedAt` on most models; `AuditLog` has createdAt only (append-only).
- **Soft delete:** `isDeleted Boolean @default(false)` + `deletedAt DateTime?` on User, TenantProfile, OwnerProfile, ManagerProfile, Property, Unit, Room, ViewingRequest, RoommateRequest, Application, Lease, Invoice, MaintenanceRequest. Absent on RoommatePair, PropertyManager, LeaseDocument, Payment, Notification, AuditLog. All queries filter `isDeleted: false`.
- **Tables:** explicit `@@map` to snake_case plurals.
- **Money:** `Decimal @db.Decimal(10,2)` (Room/Lease/Invoice/Payment amounts); JSON money blobs (`[{url, publicId}]`, amenity arrays, gateway responses).
- **Indexes:** `idx_<entity>_<cols>`; unique constraints `unique_<name>`.
- **Actor references** (`reviewedBy`, `terminatedBy`, `assignedTo`, audit `actorId`) store **User ids**, not profile ids.
- **Module shape:** `<name>.route.ts` / `.controller.ts` / `.service.ts` / `.validation.ts` / `.interface.ts`; exports `<Name>Routes`, `<Name>Controller`, `<Name>Services`, `<Name>Validation`. Controllers are thin (parse + `catchAsync` + `sendResponse`); services hold Prisma/business logic; routes declare auth roles + `validateRequest`.

## Lib & infrastructure behaviors

- **Rate limiters** (`lib/rateLimiter.ts`): `authRateLimiter` 20 req / 15 min on auth POSTs; `generalRateLimiter` 300 req / 15 min on `/api/v1`. 429 body messages documented in spec 01.
- **Redis keys** (`lib/redis.ts`): `register-otp:<email>` and `register-data:<email>` (EX 300s); `forgot-password-otp:<email>` (EX 300s); `bKash: idToken` (EX 3600s) and `bKash: refreshToken` (EX 28d); `room-public:<JSON of where+page+limit+sort>` (EX 60s); `property-public:<JSON of where+page+limit+sort>` (EX 60s); `roommate-match:<tenantProfileId>` (EX 300s). The client runs with `disableOfflineQueue: true` + bounded reconnect, so cache reads/writes fail fast (reject → caught) during a Redis outage instead of queueing forever; boot races `connect()` with a 10s timeout so the server always starts. OTP endpoints error if Redis is unavailable.
- **bKash** (`lib/bKash.ts`): `getBkashIdToken()` (grant/refresh w/ Redis TTL threshold 600s), `createBkashPayment`, `executeBkashPayment`, `refundBkashPayment`. Callback = `GET /api/v1/payment/callback` (public). Base URL from `BKASH_BASE_URL`.
- **Cloudinary** (`utils/cloudinaryUpload.ts`): `uploadFileToCloudinary(buffer, folder="housing-roommate")`, `uploadFilesToCloudinary`, `deleteFromCloudinary` (never throws). Folders used: `owner-documents`, `property-images`, `room-images`, `lease-documents`, `maintenance-images`.
- **Multer** (`lib/multer.ts`): memory storage, **8 MB per-file limit**; two typed instances — `uploadImages` (MIME allowlist: jpeg/png/webp/gif) for profile pictures, property/room galleries and maintenance photos, and `uploadDocuments` (images **+ PDF**) for lease documents and identity verification documents. Violations map in `globalErrorHandler`: wrong MIME → 400 with the allowlist message, `LIMIT_FILE_SIZE` → 413 `"File too large. Maximum allowed file size is 8MB per file"`, `LIMIT_UNEXPECTED_FILE` (wrong field name) → 400, `LIMIT_FILE_COUNT` → 400.
- **Room status recompute** (`utils/roomStatus.ts`): `recalculateRoomStatus(roomId, tx?)` — skips MAINTENANCE; occupiedBeds ≤ 0 → AVAILABLE; ≥ bedCount → OCCUPIED; else RESERVED. Called by payment (lease start), lease termination, cron finalization.
- **Email** (`utils/email.ts`): `sendTemplateEmail({ to, subject, template, data, attachments? })`.

## Background jobs (`lib/cron.ts`)

Registered in `scheduleBackgroundJobs()` (also caught up once at boot):

1. `10 0 * * *` (daily 00:10) → `generateMonthlyRentInvoices()` — for every ACTIVE lease creates one RENT invoice per month from `startDate + 1 month` (deposit covers month one) up to `endDate`, only for periods already started, idempotent via `@@unique([leaseId, type, periodStart])`. No notifications.
2. `15 0 * * *` (daily 00:15) → `finalizeExpiredLeases()` — ACTIVE leases whose `endDate < today` become COMPLETED and free one occupied bed (recompute room status).
3. `20 0 * * *` (daily 00:20) → `expirePendingApplications()` — applications left PENDING for more than 14 days become EXPIRED so owners do not have to clean them up manually.
4. `25 0 * * *` (daily 00:25) → `reconcileStaleProcessingPayments()` — payments stuck PROCESSING >24h are probed per gateway (Stripe session retrieve, bKash idempotent re-execute — an errored probe is ambiguous, SSLCommerz validator via stored val_id); definitive failed/expired → conditional downgrade (retryable); paid/ambiguous → `PAYMENT_STALE_FLAGGED` audit into the admin settle queue. Never auto-settles (spec 12).

## Uploads, seeds & templates

- **Seed accounts** (`utils/seed.ts`, on boot, skip-if-exists): SUPER_ADMIN, ADMIN, tester OWNER (APPROVED, with one property `"Green View Residence"`, one unit, two published rooms), tester PROPERTY_MANAGER (`manager@housing.com`, pre-assigned to the seed owner's property), tester TENANT (with full profile, `lookingForRoommate: true`, **VERIFIED** so payment flows work out of the box). Demo creds come from env (`.env.example`): `superadmin@housing.com`, `admin@housing.com`, `owner@housing.com`, `manager@housing.com`, `tenant@housing.com`.
- **Email templates** (`templates/*.ejs`): `welcome`, `registration-otp`, `forgot-password`, `reset-password-success`, `owner-account-approved`, `owner-account-rejected`, `tenant-account-approved`, `tenant-account-rejected`, `application-approved`, `application-rejected`, `lease-terminated`, `maintenance-status`, `invoice-created`, `payment-receipt`.

## Tooling & commands

```
npm run dev            # tsx watch src/server.ts
npm run build          # tsc
npm run start          # node dist/src/server.js
npm run lint:check / lint:fix      # Biome lint on ./src
npm run format:check / format:fix  # Biome format on ./src
```

No test suite exists — verify with live requests (Postman/Thunder Client) against a running `npm run dev` server using the seeded demo accounts.

## Cross-cutting implementation rules

- Every success response goes through `sendResponse`; every error through `AppError` + `globalErrorHandler`. Never send a bare `res.json`.
- Protect private routes with `auth(Role.X, ...)`; scope every query by `req.user.userId`; owners use `getVerifiedOwnerProfile` before touching property/room/lease data.
- Property-level delegation (spec 17) lives in `src/app/utils/propertyAccess.ts`: `resolvePropertyRole(user, propertyId, db?)` (OWNER requires the OWNER role **and** ownership — demoted ex-owners keep no powers; assigned managers resolve MANAGER) and `propertyManagerScope(userId)` (Prisma where-fragment for scoped list queries). OPERATE-tier writes resolve the resource through a manager-scoped lookup that returns a generic 404 on any miss (no ownership leak). **CONTROL** tier (create/delete of property & rooms, lease termination/refunds, payment visibility, manager assignment) is enforced by route role sets (`auth(OWNER, ...)` without PROPERTY_MANAGER) plus the verified-owner guard. Managers never enter money flows.
- Identity verification is a shared status machine: `VerificationStatus` on `OwnerProfile` (spec 04) and `TenantProfile` (spec 03). Owners must be APPROVED before property/room/lease writes; tenants must be APPROVED before starting a payment session (`pay-deposit`, invoice `pay`).
- Validate bodies with zod in `validateRequest`; reference enums from `../../../generated/prisma/enums`.
- Wrap multi-step, money, or concurrency-sensitive writes in `prisma.$transaction`; use conditional writes (`updateMany` guarded on `occupiedBeds < bedCount`) to prevent double-booking.
- Use `select`/`include` (never `*` on wide models); paginate with `page`/`limit` + `meta`; expose search/filter/sort through `IQuery`.
- Cache hot read endpoints in Redis with short TTLs and always fail soft.
- Write `writeAuditLog` for approvals, status changes, role changes, refunds.
- Money statuses must only change via the bKash callback/execute path — never flip PAID manually.

## Definition of done

- [ ] `npm run dev` boots: DB connected, Redis + email logged (fail-soft ok), five demo accounts seeded, cron scheduled.
- [ ] `GET /api/v1/health` and `GET /` return the documented envelopes.
- [ ] Hitting an unknown route returns 404 `"Route not found"`; an unauthenticated protected route returns 401; a wrong-role call returns 403.
- [ ] A zod violation returns 400 with `errors: [{ field, message }]`.
- [ ] `npm run lint:check`, `npm run format:check`, `npm run build` pass.
