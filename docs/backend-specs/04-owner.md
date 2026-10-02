# Spec 04 — Owner Profile & Verification

## Overview

Owner self-service (profile read/update, verification documents) plus the admin verification workflow. Registration creates the `OwnerProfile` with `verificationStatus: PENDING`; owners upload identity documents (Cloudinary) and request review; an ADMIN/SUPER_ADMIN approves or rejects with a reason, triggering audit log, email, and notification. Only **APPROVED** owners may manage properties/rooms (enforced via `getVerifiedOwnerProfile`, spec 05/06). Admins browse all owners via a filtered, paginated list.

## Depends on

- `prisma/schema/owner.prisma`, `user.prisma`, `property.prisma`, `enums.prisma`
- `src/app/utils/ownerGuard.ts`, `audit.ts`, `notification.ts`, `email.ts`, `cloudinaryUpload.ts`
- `src/app/lib/multer.ts`, `cloudinary.ts`
- `src/app/module/owner/*`
- Mount: `/api/v1/owner` in `src/app/app.ts`
- Templates: `owner-account-approved`, `owner-account-rejected`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/owner/me` | auth(OWNER) | 200 `"Owner profile fetched successfully"` | OWNER |
| PATCH | `/api/v1/owner/update-me` | auth(OWNER), validateRequest(UpdateOwnerProfileZodSchema) | 200 `"Owner profile updated successfully"` | OWNER |
| POST | `/api/v1/owner/verification-documents` | auth(OWNER), upload.array("documents", 5) | 200 `"Verification documents uploaded successfully"` | OWNER |
| DELETE | `/api/v1/owner/verification-documents` | auth(OWNER) | 200 `"Verification document removed successfully"` | OWNER |
| POST | `/api/v1/owner/request-verification` | auth(OWNER) | 200 `"Owner verification request submitted successfully"` | OWNER |
| PATCH | `/api/v1/owner/verify` | auth(ADMIN, SUPER_ADMIN), validateRequest(VerifyOwnerZodSchema) | 200 `"Owner verification status updated successfully"` | ADMIN/SUPER_ADMIN |
| GET | `/api/v1/owner/all-owners` | auth(ADMIN, SUPER_ADMIN) | 200 `"Owners fetched successfully"` (meta) | ADMIN/SUPER_ADMIN |

## Request/response contracts

**`update-me`** (`.strict()`): `contactNumber` string min 8 (`"Contact number must be at least 8 characters long"`), `companyName` string min 2 (`"Company name must be at least 2 characters long"`), `address` string.

**`verify`** (not strict): `ownerProfileId` (min 1, required), `verificationStatus` enum `APPROVED` \| `REJECTED` (PENDING is not accepted), `rejectionReason` string optional with `superRefine`: required when REJECTED (`"Rejection reason is required when rejecting an owner"`).

**`verification-documents`** upload: field `documents`, max 5 files (`uploadDocuments`: images or PDF, 8 MB limit); no file → 400 `"No documents uploaded"`. Remove uses JSON body `{ publicId }` (controller: missing → 400 `"publicId is required"`). Responses return the documents array `[{ url, publicId }]`.

**`all-owners`** query params (`IQuery`, raw): `page` (1), `limit` (10), `searchTerm` (contains-insensitive OR over profile `name`, `email`, `companyName`), `verificationStatus` (exact), `sortBy` (createdAt), `sortOrder` (desc). Base filter `isDeleted: false`. Each row includes `user { id, name, email, role, status, imageUrl, createdAt }` and `_count: { properties }`. Meta present.

Responses: `me` → profile + nested `user` (password omitted); update/verify/request → updated profile; documents list/remove → documents array.

## Business rules

- `verifyOwnerProfile(payload, reviewer)` — guards: missing → 404 `"Owner profile not found"`; already soft-deleted → 404 `"Owner profile has already been deleted"`; not PENDING → 409 `` `Owner verification has already been ${status.toLowerCase()}` `` (no idempotent re-review); REJECTED without reason → 400. Update sets `verificationStatus`, `rejectionReason` (cleared to null on APPROVE), `reviewedBy` = reviewer userId, `reviewedAt` = now. Then `writeAuditLog` (`OWNER_APPROVED`/`OWNER_REJECTED` on entity `OwnerProfile`), email (`Your Owner Account Has Been Approved`/`Rejected`), and SYSTEM notification (`"Owner account approved ✅"` / `"Owner account rejected ❌"`, message tells the owner they can now list properties / the rejection reason).
- `uploadVerificationDocuments` — merges (append-only) uploaded docs into the profile `documents` JSON after parallel Cloudinary uploads to folder `owner-documents`; does not change verification status.
- `removeVerificationDocument` — writes the filtered array to the DB first, then best-effort `deleteFromCloudinary` (never throws).
- `requestVerification` — sets status back to `PENDING`, clears `rejectionReason`/`reviewedBy`/`reviewedAt`; 409 `"Owner verification is already pending"` if already PENDING.
- `updateMyOwnerProfile` — updates the 3 contact fields only; does **not** reset verification status.
- `getMyOwnerProfile` — profile + user (password omitted); 404 `"Owner profile not found"`.
- `getAllOwners` — admin list (as above), no errors thrown.

## Data model

`OwnerProfile` (`owner_profiles`): id `cuid`, `name`, `email` @unique, `contactNumber?`, `companyName?`, `address?`, `verificationStatus` (default PENDING, idx), `rejectionReason?`, `reviewedBy?`, `reviewedAt?`, `documents Json?` `[{url, publicId}]`, soft-delete, timestamps, `userId @unique` → User (cascade), `properties Property[]`.

State machine: `PENDING → APPROVED | REJECTED` (admin only); `REJECTED|APPROVED → PENDING` (owner re-request). Owner mutation guards elsewhere require `verificationStatus === APPROVED`. No schema changes.

## Definition of done

- [ ] Owner reads/updates profile and uploads 5 documents (Cloudinary folder `owner-documents`); remove deletes one.
- [ ] PENDING owner cannot create a property (403 `"Your owner account is pending.…"`).
- [ ] Admin approves → owner status APPROVED, audit log + email + notification fired; re-approve → 409.
- [ ] Admin rejects without reason → 400; `all-owners` filters/paginates and returns `_count.properties`.
- [ ] `lint:check`/`format:check`/`build` pass.
