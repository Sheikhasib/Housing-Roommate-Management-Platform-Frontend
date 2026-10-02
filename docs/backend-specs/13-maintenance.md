# Spec 13 — Maintenance Requests

## Overview

TENANTs report maintenance on a room they are actively leasing. Each request captures category, priority, title, description, and links the active lease; the room's OWNER, an **assigned PROPERTY_MANAGER** (spec 17), or an ADMIN/SUPER_ADMIN moves it through a strict forward-only state machine, and the tenant/owner/assigned-manager/admin may attach a photo. Every status change notifies and emails the tenant. Reports never flip `RoomStatus.MAINTENANCE` — the maintenance workflow is independent of room availability.

## Depends on

- `prisma/schema/maintenance.prisma`, `lease.prisma`, `room.prisma`, `enums.prisma`
- `src/app/utils/notification.ts`, `email.ts`, `cloudinaryUpload.ts`, `propertyAccess.ts` (`propertyManagerScope`)
- `src/app/lib/multer.ts`
- `src/app/module/maintenance/*`
- Mount: `/api/v1/maintenance` in `src/app/app.ts`
- Template: `maintenance-status`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| POST | `/api/v1/maintenance/` | auth(TENANT), validateRequest(CreateMaintenanceRequestZodSchema) | 201 `"Maintenance request created successfully"` | TENANT (active lease) |
| GET | `/api/v1/maintenance/my-requests` | auth(TENANT) | 200 `"Maintenance requests fetched successfully"` (meta) | TENANT |
| GET | `/api/v1/maintenance/owner-requests` | auth(OWNER, PROPERTY_MANAGER) | 200 `"Maintenance requests fetched successfully"` (meta) | OWNER (verified) or assigned MANAGER |
| PATCH | `/api/v1/maintenance/:requestId/status` | auth(OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN), validateRequest(UpdateMaintenanceStatusZodSchema) | 200 `"Maintenance request updated successfully"` | OWNER or assigned MANAGER (of room)/ADMIN |
| POST | `/api/v1/maintenance/:requestId/image` | auth(TENANT, OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN), upload.single("image") | 200 `"Maintenance image uploaded successfully"` | Reporter/room owner/assigned manager/admin |

## Request/response contracts

**`CreateMaintenanceRequestZodSchema`** (not strict): `roomId` required (`"roomId is required"`); `category` optional enum PLUMBING/ELECTRICAL/APPLIANCE/FURNITURE/PAINTING/CLEANING/OTHER (`"Invalid category."`, DB default OTHER); `priority` optional enum LOW/MEDIUM/HIGH/URGENT (`"Invalid priority."`, default MEDIUM); `title` required min 3 / max 100; `description` string max 1000 optional.

**`UpdateMaintenanceStatusZodSchema`** (`.strict()`): `status` required enum OPEN/ASSIGNED/IN_PROGRESS/RESOLVED/CLOSED (`"Invalid status."`); `assignedTo` optional string; `resolutionNotes` optional string.

**Query params** (lists, raw): page=1, limit=10, optional `status`; `owner-requests` also optional `roomId`; order `createdAt desc`.

Response shapes: create/status/image → the updated `MaintenanceRequest` row. `my-requests` rows include `room` (with `property { id, title, city }`); `owner-requests` rows include `tenantProfile { id, name, email, contactNumber, user { imageUrl } }` and `room { id, name }`.

## Business rules

- `createMaintenanceRequest` — tenant profile (404 `"Tenant profile not found"`); the caller must hold an ACTIVE lease on that room, **or** be an ACTIVE roommate member of the room's lease (P3, spec 08 — the request then attaches to the holder's lease) else 403 `"You need an active lease on this room to report maintenance"`. Creates the request linked to the active lease (status OPEN); notifies the property owner (MAINTENANCE, `"New maintenance request 🔧"`). No email on create.
- `getOwnerRequests` — OWNER scoped by `room.property.ownerId`; PROPERTY_MANAGER scoped via `room.property` matching `propertyManagerScope(user)`; optional `roomId` inside the scope.
- `updateMaintenanceStatus` — reporter scoping: room owner by `user.userId`, an assigned manager of the room's property (via the property-manager join), or admin, else 403 `"You are not allowed to update this maintenance request"`. Forward-only state machine:
  - `OPEN → ASSIGNED | IN_PROGRESS | RESOLVED | CLOSED`
  - `ASSIGNED → IN_PROGRESS | RESOLVED | CLOSED`
  - `IN_PROGRESS → RESOLVED | CLOSED`
  - `RESOLVED → CLOSED`
  - `CLOSED` → terminal; any invalid/backward/self move → 400 `` `Cannot move request from ${current.toLowerCase()} to ${next.toLowerCase()}` ``
  - RESOLVED requires `resolutionNotes` → 400 `"Resolution notes are required when resolving a request"`.
  - Field semantics: `assignedTo`/`assignedAt` set only when transitioning to ASSIGNED (`assignedTo ||= acting user`); `resolvedAt` only when RESOLVED; `resolutionNotes` kept when moving into RESOLVED/CLOSED.
  - Always on success (fail-soft — a committed status change never 500s): MAINTENANCE notification to the tenant (title `` `Maintenance ${next.replace("_"," ").toLowerCase()} 🔧` ``) and `maintenance-status` email (subject uses the raw enum value).
  - Writes a `MAINTENANCE_STATUS_UPDATED` audit entry atomically inside the same transaction (before/after status).
- `uploadMaintenanceImage` — reporter (tenant who raised it), room owner, an assigned manager of the room's property, or admin, else 403 `"You are not allowed to attach an image to this request"`. Uploads to Cloudinary folder `maintenance-images` (`uploadImages`: jpeg/png/webp/gif, 8 MB limit); stores single `imageUrl`/`imagePublicId` (second upload overwrites; the old Cloudinary asset is deliberately not removed — it may be evidence of the issue's original state, and the single-pointer model makes destruction irreversible). No notification.

No admin-wide list and no delete route exist for this module (status-change auditing does exist — see above).

## Data model

`MaintenanceRequest` (`maintenance_requests`): id uuid, `category` default OTHER, `priority` default MEDIUM, `title`, `description?`, `imageUrl?`, `imagePublicId?`, `status` default OPEN (idx), `assignedTo?`, `assignedAt?`, `resolutionNotes?`, `resolvedAt?`, soft-delete, timestamps; `tenantProfileId` (cascade, idx), `roomId` (cascade, idx), `leaseId?` → Lease (`onDelete: SetNull`). No schema changes required.

## Definition of done

- [ ] A TENANT with an ACTIVE lease reports maintenance → OPEN, owner notified; a tenant without an active lease → 403.
- [ ] An ACTIVE roommate member (spec 08) reports maintenance on their room → 201 attached to the holder's lease; a tenant with no lease and no membership → 403.
- [ ] Owner/assigned manager/admin walks the state machine forward; RESOLVED without notes → 400; CLOSED → no further moves; tenant notified + emailed on each change.
- [ ] Tenant/owner/assigned manager/admin attach an image; an unrelated user → 403.
- [ ] Tenant sees only their requests; owner sees only requests on their rooms (with `roomId` filter).
- [ ] `lint:check`/`format:check`/`build` pass.
