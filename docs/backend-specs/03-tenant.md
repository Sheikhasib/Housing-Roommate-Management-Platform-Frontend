# Spec 03 — Tenant Profile

## Overview

Tenant self-service over their own `TenantProfile`. The profile is created automatically at registration (role TENANT) or by a SUPER_ADMIN role change (spec 15). This module reads the full profile, edits the roommate-matching/lifestyle fields, and manages the **identity-verification** document: a tenant uploads a NID/verification doc which an ADMIN/SUPER_ADMIN approves or rejects (spec 15). Only **APPROVED** tenants may start payment sessions (booking deposit or invoice — enforced in specs 09/11); browsing, viewing, matching, and applying stay open. `name`/`email` are denormalized and managed elsewhere (specs 01/02/15).

## Depends on

- `prisma/schema/tenant.prisma`, `enums.prisma`
- `src/app/middleware/checkAuth.ts`, `validateRequest.ts`
- `src/app/utils/cloudinaryUpload.ts`, `src/app/lib/multer.ts`, `cloudinary.ts`
- Mount: `/api/v1/tenant` in `src/app/app.ts`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/tenant/me` | auth(TENANT) | 200 `"Tenant profile fetched successfully"` | Protected (TENANT) |
| PATCH | `/api/v1/tenant/update-me` | auth(TENANT), validateRequest(UpdateTenantProfileZodSchema) | 200 `"Tenant profile updated successfully"` | Protected (TENANT) |
| PATCH | `/api/v1/tenant/verification-document` | auth(TENANT), upload.single("document") | 200 `"Verification document uploaded successfully"` | Protected (TENANT) |

## Request/response contracts

**`update-me`** — zod schema is `.strict()` (unknown keys rejected); all fields optional; only present fields are written:

| Field | Rule |
|---|---|
| `contactNumber` | string |
| `gender` | enum MALE \| FEMALE \| OTHER (`"Invalid gender."`) |
| `dateOfBirth` | ISO-8601 datetime with offset (`"dateOfBirth must be a valid date"`) or JS Date |
| `occupation` | string |
| `bio` | string, max 500 (`"Bio must be at most 500 characters long"`) |
| `preferredCity` | string |
| `monthlyBudgetMax` | int (`"Budget must be an integer."`), positive (`"Budget must be positive."`), max 1,000,000 (`"Budget seems unrealistically high."`) |
| `moveInDate` | ISO-8601 datetime with offset (`"moveInDate must be a valid date"`) or JS Date |
| `smoker` | boolean |
| `petFriendly` | boolean |
| `hasPets` | boolean |
| `lookingForRoommate` | boolean |

Empty `{}` is valid (no-op). Response shapes:
- `GET /me` → `data`: full `TenantProfile` + nested `user` (password omitted).
- `PATCH /update-me` → `data`: updated `TenantProfile` (no nested user). No `meta` on either.

**`verification-document`** — `multipart/form-data`, field `document` (single file, memory
buffer; `uploadDocuments`: images or PDF, 8 MB limit). Controller: no file → 400 `"No document uploaded"`. Response `data`: the updated
`TenantProfile` (now including `verificationDocUrl`/`verificationDocPublicId`).

## Business rules

- `getMyTenantProfile(user)`: `tenantProfile.findUnique({ where: { userId } })`; missing → 404 `"Tenant Profile Not Found"`. Includes `user` (password omitted).
- `updateMyTenantProfile(payload, user)`: resolve by `userId` (404 `"Tenant Profile Not Found"`); `dateOfBirth`/`moveInDate` coerced with `new Date(value)` when truthy; single `tenantProfile.update`. No notifications/audit/Redis/transaction.
- `uploadVerificationDocument(buffer, user)`: resolve tenant profile (404 `"Tenant Profile Not Found"`); upload to Cloudinary folder `verification-docs`; replace the previous doc fields (`verificationDocUrl`/`verificationDocPublicId`) and **reset** `verificationStatus` to PENDING with `rejectionReason`/`reviewedBy`/`reviewedAt` cleared (re-submit after a rejection). The admin review itself lives in spec 15 (`TENANT_APPROVED`/`TENANT_REJECTED` → audit + email `tenant-account-approved`/`tenant-account-rejected` + SYSTEM notification).
- Registration sets the base profile (spec 01); fields `dateOfBirth`, `bio`, `moveInDate`, `hasPets` are only settable here later.
- **Gate**: tenant payment sessions require `verificationStatus === APPROVED` (403 in specs 09/11). This module never blocks read/preferences.

## Data model

`TenantProfile` (`tenant_profiles`): id `uuid(7)`, `name` (denormalized), `email` @unique, `contactNumber?`, `gender?`, `dateOfBirth?`, `occupation?`, `bio?`, `preferredCity?` (idx), `monthlyBudgetMax?` Int, `moveInDate?`, `smoker`/`petFriendly`/`hasPets` (default false), `lookingForRoommate` (default false, idx), `verificationStatus` (default PENDING, idx), `verificationDocUrl?`, `verificationDocPublicId?`, `rejectionReason?`, `reviewedBy?`, `reviewedAt?`, soft-delete, timestamps, `userId @unique` → User (cascade). Relations: applications, leases, viewingRequests, maintenanceRequests, roommateRequestsSent/Received, roommatePairsAsA/AsB. Schema change: verification fields + `VerificationStatus` enum (P2).

## Definition of done

- [ ] TENANT reads their full profile (with user, no password).
- [ ] TENANT updates lifestyle fields; PATCH persists exactly the provided fields.
- [ ] TENANT uploads a verification document → stored in Cloudinary (`verification-docs`), status reset to PENDING; re-upload after REJECTED clears the rejection.
- [ ] Admin approves/rejects (spec 15) → email + notification; an APPROVED tenant appears as VERIFIED in `GET /tenant/me`.
- [ ] Unknown key on `update-me` → 400 with structured error; `monthlyBudgetMax` over 1,000,000 or non-positive → 400.
- [ ] Non-TENANT role → 403; unauthenticated → 401.
