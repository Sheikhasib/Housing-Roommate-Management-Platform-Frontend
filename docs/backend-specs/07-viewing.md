# Spec 07 — Viewing Requests

## Overview

TENANTs request to view a published room on a preferred date/time-slot (MORNING/AFTERNOON/EVENING). The room's OWNER or an **assigned PROPERTY_MANAGER** (spec 17, OPERATE tier), or ADMIN/SUPER_ADMIN, approves (optionally scheduling an explicit `scheduledDateTime`, defaulting to the preferred date), rejects with a reason, or marks completed (only after approval). TENANTs can cancel their own request while PENDING or APPROVED. Both sides get filtered/paginated lists and in-app notifications (`NotificationType.VIEWING`).

## Depends on

- `prisma/schema/viewing.prisma`, `room.prisma`, `tenant.prisma`, `enums.prisma`
- `src/app/utils/notification.ts`, `propertyAccess.ts` (`propertyManagerScope`)
- `src/app/module/viewing/*`
- Mount: `/api/v1/viewing` in `src/app/app.ts`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| POST | `/api/v1/viewing/` | auth(TENANT), validateRequest(CreateViewingRequestZodSchema) | 201 `"Viewing request submitted successfully"` | TENANT |
| GET | `/api/v1/viewing/my-requests` | auth(TENANT) | 200 `"Viewing requests fetched successfully"` (meta) | TENANT |
| GET | `/api/v1/viewing/owner-requests` | auth(OWNER, PROPERTY_MANAGER) | 200 `"Viewing requests fetched successfully"` (meta) | OWNER (verified) or assigned MANAGER |
| POST | `/api/v1/viewing/:requestId/cancel` | auth(TENANT) | 200 `"Viewing request cancelled successfully"` | TENANT (owner) |
| PATCH | `/api/v1/viewing/:requestId/status` | auth(OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN), validateRequest(UpdateViewingStatusZodSchema) | 200 `"Viewing request updated successfully"` | OWNER or assigned MANAGER (of room) / ADMIN |

## Request/response contracts

**`CreateViewingRequestZodSchema`**: `roomId` required (`"roomId is required"`); `preferredDate` required ISO offset datetime (`"preferredDate must be a valid date"`); `timeSlot` enum MORNING/AFTERNOON/EVENING optional (`"Invalid time slot."`, DB default MORNING); `message` string max 500 optional.

**`UpdateViewingStatusZodSchema`**: `status` enum `APPROVED`\|`REJECTED`\|`COMPLETED` (`"Status must be APPROVED, REJECTED or COMPLETED"` — PENDING/CANCELLED cannot be set); `scheduledDateTime` optional datetime; `rejectionReason` optional string with `superRefine`: required when REJECTED (`"Rejection reason is required when rejecting a viewing request"`).

**List query params** (raw `IQuery`): page=1, limit=10; optional `status` filter (both lists); optional `roomId` (owner list). Always `orderBy createdAt desc`.

Response shapes:
- `my-requests` → rows with full `room` and `room.property { id, title, city, area }`.
- `owner-requests` → rows with `tenantProfile { id, name, email, contactNumber, occupation, user { imageUrl } }` and `room { id, name, monthlyRent }`.
- create/cancel/status → the affected `ViewingRequest` row.

## Business rules

- `createViewingRequest` — tenant profile required (404 `"Tenant profile not found"`); room must be `isDeleted: false, isPublished: true` (404 `"Room not found"`; room status not checked); one duplicate PENDING request per tenant+room → 409 `"You already have a pending viewing request for this room"`. Notifies the property owner (VIEWING, `"New viewing request 🏠"`). No time-slot conflict detection.
- `getOwnerRequests` — OWNER scoped by `room.property.ownerId`; PROPERTY_MANAGER scoped via `room.property` matching `propertyManagerScope(user)` (assigned properties only); optional `roomId` must fall inside that scope.
- `updateViewingStatus` — gates: request not found/deleted → 404 `"Viewing request not found"`; TENANT caller → 403 `"You are not allowed to update viewing request status"`; an OWNER who doesn't own the room → 403 `"You are not the owner of this room"`; a PROPERTY_MANAGER who is not assigned to the room's property → 403 (same shape); ADMIN bypasses. Same-status repeat → 409 `` `Viewing request is already ${status.toLowerCase()}` ``. Transition not in the allowed map → 400 `` `Cannot move viewing request from ${from.toLowerCase()} to ${to.toLowerCase()}` ``. REJECTED without reason → 400. Approving sets `scheduledDateTime` to the payload value or falls back to `preferredDate`, and clears `rejectionReason`; REJECTED stores the reason. Runs inside a guarded transaction (conditional `updateMany` keyed on the pre-read status); if another actor changed the status in between → 409 `"Viewing request was updated by someone else. Please refresh and try again."`. Writes a `VIEWING_STATUS_UPDATED` audit entry atomically (actorRole recorded as OWNER or PROPERTY_MANAGER). Notifies the tenant (VIEWING, `` `Viewing request ${status.toLowerCase()} 📅` ``; REJECTED message includes the reason; COMPLETED `"Your viewing has been completed. We hope you liked the room!"`).
- `cancelViewingRequest` — tenant profile required; scoped find (`tenantProfileId`), missing or not-owned → generic 404 `"Viewing request not found"`; PENDING or APPROVED cancellable, else 409 `` `Viewing request is already ${status.toLowerCase()}` ``; sets CANCELLED inside a guarded transaction (conditional `updateMany` where `status in [PENDING, APPROVED]`); if a concurrent owner decision changed the status in between → 409 `"Viewing request is no longer cancellable. Please refresh and try again."`. Writes a `VIEWING_CANCELLED` audit entry atomically and notifies the room owner (VIEWING, `"Viewing request cancelled 📅"`, message `` `${tenant.name} cancelled their viewing request for "${room.name}".` ``).

State transitions: `PENDING → APPROVED | REJECTED` (owner/assigned manager/admin), `APPROVED → COMPLETED` (owner/assigned manager/admin — a viewing can only complete after it was approved), `PENDING | APPROVED → CANCELLED` (tenant). Status-update and cancel are guarded transactional writes (race-safe); no Redis in this module.

## Data model

`ViewingRequest` (`viewing_requests`): id uuid, `preferredDate`, `timeSlot` default MORNING, `message?`, `scheduledDateTime?`, `status` default PENDING (idx), `rejectionReason?`, soft-delete, timestamps, `tenantProfileId` → TenantProfile (cascade, idx), `roomId` → Room (cascade, idx). No schema changes required.

## Definition of done

- [ ] TENANT creates a request for a published room; duplicate PENDING → 409; owner receives VIEWING notification.
- [ ] Owner lists requests for their rooms only (with `roomId`/`status` filters) and sees tenant contact details.
- [ ] Assigned MANAGER lists and responds for the property's requests only; an unassigned MANAGER → 403 on status update and sees an empty/their-own list.
- [ ] Owner approves (scheduledDateTime falls back to preferredDate), rejects without reason → 400, or completes; tenant notified each time.
- [ ] Non-owner OWNER → 403; TENANT cancels own PENDING or APPROVED request → 200 CANCELLED (owner notified, audit written); cancel of REJECTED/COMPLETED/CANCELLED → 409.
- [ ] PENDING → COMPLETED → 400; APPROVED → COMPLETED → 200 (tenant notified).
- [ ] `lint:check`/`format:check`/`build` pass.
