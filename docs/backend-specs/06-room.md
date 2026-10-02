# Spec 06 — Rooms & Availability

## Overview

Rooms are the rentable units under a Property (optionally inside a Unit). Verified owners create rooms with bed counts, pricing and amenities, then manage availability via a status (`AVAILABLE/RESERVED/OCCUPIED/MAINTENANCE`) + publish flag. An **assigned PROPERTY_MANAGER** may update room details, toggle availability, and manage images (spec 17), but only owners/admins create or delete rooms. TENANTs search published rooms publicly with rich filters and rent sorting; occupancy is tracked by `bedCount`/`occupiedBeds` and driven by lease/payment flows (specs 09/10/12), not by this module. Vacancy and upcoming releases are computed **on the fly** (`computeAvailability`) from the live counters + ACTIVE lease end dates — no denormalized column, no cron: the per-property **availability board** serves owners/managers/admins (counts + dates only), the public search gains an `availability` filter (`available` default / `upcoming` / `all`), and every room read surface is decorated with `vacantBeds`/`availableNow`/`nextAvailableDate`/`upcomingReleaseDates`. The public search is the only Redis-cached endpoint in this module (60s TTL).

## Depends on

- `prisma/schema/room.prisma`, `property.prisma`, `lease.prisma`, `enums.prisma`
- `src/app/utils/ownerGuard.ts`, `propertyAccess.ts` (`propertyManagerScope`), `cloudinaryUpload.ts`, `roomStatus.ts`
- `src/app/lib/multer.ts`, `redis.ts`
- `src/app/module/room/*`
- Mount: `/api/v1/room` in `src/app/app.ts`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| POST | `/api/v1/room/` | auth(OWNER), validateRequest(CreateRoomZodSchema) | 201 `"Room created successfully"` | OWNER (verified) |
| GET | `/api/v1/room/my-rooms` | auth(OWNER) | 200 `"Rooms fetched successfully"` (meta) | OWNER (verified) |
| GET | `/api/v1/room/availability/:propertyId` | auth(OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN) | 200 `"Room availability fetched successfully"` | Owning OWNER (verified), assigned MANAGER, ADMIN/SUPER_ADMIN |
| GET | `/api/v1/room/public` | none | 200 `"Rooms fetched successfully"` (meta) | Public |
| GET | `/api/v1/room/:roomId` | optionalAuth (decode-if-present, never rejects) | 200 `"Room fetched successfully"` | Public (published rooms only); owning OWNER, assigned MANAGER + ADMIN/SUPER_ADMIN see any room incl. drafts |
| PATCH | `/api/v1/room/:roomId` | auth(OWNER, PROPERTY_MANAGER), validateRequest(UpdateRoomZodSchema) | 200 `"Room updated successfully"` | OWNER (verified) or assigned MANAGER |
| PATCH | `/api/v1/room/:roomId/availability` | auth(OWNER, PROPERTY_MANAGER), validateRequest(SetRoomAvailabilityZodSchema) | 200 `"Room availability updated successfully"` | OWNER (verified) or assigned MANAGER |
| DELETE | `/api/v1/room/:roomId` | auth(OWNER, ADMIN, SUPER_ADMIN) | 200 `"Room deleted successfully"` | OWNER (effective) |
| POST | `/api/v1/room/:roomId/images` | auth(OWNER, PROPERTY_MANAGER), upload.array("images", 10) | 200 `"Room images uploaded successfully"` | OWNER (verified) or assigned MANAGER |
| DELETE | `/api/v1/room/:roomId/images` | auth(OWNER, PROPERTY_MANAGER) | 200 `"Room image removed successfully"` | OWNER (verified) or assigned MANAGER |

Owner mutations resolve ownership as `room.findFirst({ id, isDeleted: false, property: { ownerId: ownerProfile.id } })`; not owned → generic 404 `"Room not found"`. MANAGER mutations resolve the same room via `propertyManagerScope` (assigned membership on the parent property) and reuse the identical validation rules — delegation, never new powers. Room **create** and **delete** remain OWNER-only.

## Request/response contracts

**`CreateRoomZodSchema`** (not strict):

| Field | Rule |
|---|---|
| `propertyId` | string required (`"propertyId is required"`) |
| `unitId` | optional string |
| `name` | string required, min 1 (`"Room name is required"`), max 50 (`"Room name must be at most 50 characters"`) |
| `description` | optional string |
| `type` | enum RoomType (PRIVATE_ROOM/SHARED_ROOM/ENTIRE_FLAT/BED) — `"Invalid room type."` |
| `bedCount` | int min 1 (`"A room must have at least one bed"`), max 8 (`"A room can have at most 8 beds"`) |
| `monthlyRent` | number required, positive (`"monthlyRent must be positive"`) |
| `bookingDeposit` | number non-negative (`"bookingDeposit cannot be negative"`) |
| `minLeaseMonths` | int min 1 / max 60 |
| `sizeSqft` | int positive |
| `isFurnished` | boolean |
| `amenities` | `string[]` |
| `availableFrom` | ISO-8601 datetime with offset |

**`UpdateRoomZodSchema`** (strict): name/description/type/bedCount (no max 8)/monthlyRent/bookingDeposit/minLeaseMonths (no max 60)/sizeSqft/isFurnished/amenities — all optional; cannot change propertyId/unitId/availableFrom/status/isPublished. **`SetRoomAvailabilityZodSchema`** (strict): `status` enum RoomStatus, `isPublished` boolean, `availableFrom` datetime.

**`public`** query (`IQuery`, raw): page=1, limit=10, sortBy=`monthlyRent`, sortOrder=`asc`. Hard base filter: `isDeleted: false, isPublished: true, property: { isDeleted: false }`. **`availability`** filter (lenient — unknown values fall back to the default): `available` (default, status notIn `[OCCUPIED, MAINTENANCE]`), `upcoming` (`status: OCCUPIED` + a live ACTIVE lease; rows whose computed `nextAvailableDate` is null are dropped as a drift guard), `all` (status notIn `[MAINTENANCE]`). Other filters: `searchTerm` (OR contains-insensitive on room name/description, property title/area), `propertyType`, `city` (insensitive equality), `type` (RoomType), `minRent`/`maxRent` (gte/lte on monthlyRent), `isFurnished` (only `"true"`). Response items add computed `availableBeds = max(bedCount − occupiedBeds, 0)` plus the availability decoration (`vacantBeds`, `availableNow`, `nextAvailableDate`, `upcomingReleaseDates`) and stringify `monthlyRent`/`bookingDeposit`; include nested `property { id, title, type, city, area, images, owner { id, name, companyName, user { imageUrl } } }`.

**`my-rooms`** query: page/limit/sortBy=`createdAt`/sortOrder=`desc`, filters `status`, `isPublished` (`"true"`/`"false"`), `propertyId`. Includes `property { id, title, city, images }` and `_count: { applications, leases }`; rows are decorated with `availableBeds` + the availability decoration (`vacantBeds`, `availableNow`, `nextAvailableDate`, `upcomingReleaseDates`).

**`availability/:propertyId`** (no query params) returns `{ property { id, title, city }, summary, rooms[] }` where `summary = { totalRooms, totalBeds, occupiedBeds, vacantBeds, occupancyRate, fullyVacantRooms, partiallyOccupiedRooms, fullRooms, maintenanceRooms, nextAvailableDate }` (nextAvailableDate = earliest upcoming release across rooms with zero vacant beds; null when nothing is pending) and each room row = `{ id, name, status, isPublished, bedCount, occupiedBeds, vacantBeds, availableNow, nextAvailableDate, upcomingReleaseDates }`. **Dates and counts only — never tenant identities** (managers may read this without crossing the spec 17 PII/money boundary). Access resolution: OWNER → `getVerifiedOwnerProfile` + ownership (any miss → generic 404 `"Property not found"`); PROPERTY_MANAGER → `resolvePropertyRole` ∈ {OWNER, MANAGER} else 403 `"You are not allowed to view this property's availability"`; ADMIN/SUPER_ADMIN → any live property (404 on missing/soft-deleted).

## Business rules

- `createRoom` — verified owner; property must be owned (`getOwnedPropertyOrThrow` → 404 `"Property not found"`); unit if given must belong to that property → 400 `"Unit does not belong to the given property"`; `bookingDeposit ??= monthlyRent`; `bedCount ??= 1`; `minLeaseMonths ??= 1`; status starts `AVAILABLE`, `isPublished: false`.
- `setRoomAvailability` — guard: setting `AVAILABLE` is blocked (409 `"Room is fully occupied by active leases. You cannot mark it available."`) when ACTIVE lease count ≥ `bedCount`. Otherwise the caller (owner or assigned manager) may set any status/publish flag/availableFrom (no further state machine here).
- **Audits**: `updateRoom` and `setRoomAvailability` run update + `writeAuditLog` in one transaction for ANY actor — `ROOM_UPDATED` (before/after name, bedCount, monthlyRent-as-string) and `ROOM_AVAILABILITY_UPDATED` (before/after status + isPublished) with `actorRole` recorded. Image upload/remove stays unaudited (asset churn, consistent with lease documents and profile pictures).
- `deleteRoom` — blocks deletion with active leases (409 `"Room cannot be deleted while it has active leases"`); soft-deletes + forces `isPublished: false`. Effective-owner only (ADMIN/SUPER_ADMIN without an OwnerProfile hit the owner guard 404); managers cannot delete rooms.
- Images: field `images` max 10 (`uploadImages`: jpeg/png/webp/gif, 8 MB limit) → Cloudinary folder `room-images`, appended to `images` JSON; remove writes DB first, then fail-soft Cloudinary destroy. No image cache invalidation.
- **Redis**: only `getPublicRooms` caches `room-public:<JSON.stringify({ andConditions, limit, page, sortBy, sortOrder })>` EX 60s, full `{data, meta}` payload, fail-soft read/write; no invalidation from mutations (≤60s staleness accepted). The `availability` param flows into `andConditions`, so each mode caches under its own key; the availability board and my-rooms are not cached.
- **Availability computation** (`computeAvailability`, on the fly): `vacantBeds = max(bedCount − occupiedBeds, 0)`; `availableNow = vacantBeds > 0 && status ≠ MAINTENANCE`; `nextAvailableDate = null` when availableNow, else the earliest ACTIVE lease `endDate`; `upcomingReleaseDates` = all ACTIVE lease end dates (ISO, asc). A lease end date that has already passed but whose bed is not yet freed (the finalize cron runs 00:15) is **clamped to now** — the board never advertises a past date. Active-lease release dates are dates only, never tenant identities. Room detail (`/:roomId`) is decorated identically (`availableBeds` + availability fields) on every viewer path (guest/tenant, owner, manager).
- Occupancy is incremented at deposit success (payment module) and decremented at termination/completion (lease module + cron), which also recompute room status.

## Data model

`Room` (`rooms`): id uuid, `name`, `description?`, `type` default PRIVATE_ROOM, `bedCount` default 1, `occupiedBeds` default 0, `monthlyRent` Decimal(10,2) required, `bookingDeposit` Decimal default 0, `minLeaseMonths` default 1, `sizeSqft?`, `isFurnished`, `amenities Json?`, `images Json?`, `availableFrom?`, `status` default AVAILABLE (idx), `isPublished`, soft-delete, timestamps; `propertyId` → Property (cascade), `unitId?` → Unit (`onDelete: SetNull`); `@@unique([propertyId, unitId, name])`; relations applications/leases/viewingRequests/invoices/maintenanceRequests. No schema changes required.

## Definition of done

- [ ] Verified OWNER creates a room (defaults: deposit = rent, status AVAILABLE, unpublished).
- [ ] Public search returns only published AVAILABLE/RESERVED rooms, honors all filters, sorts by rent, and is served from Redis on repeat calls.
- [ ] `availability=upcoming` returns published OCCUPIED rooms with a `nextAvailableDate` (never a past date; drift rows dropped); `availability=all` includes full rooms; default/unknown values keep the historical behavior.
- [ ] Availability board: owner + assigned manager + admin all get counts/dates (no tenant identities); an unassigned manager → 403; a tenant → 403; a foreign owner → generic 404.
- [ ] `my-rooms` and room detail rows carry `availableBeds` + `nextAvailableDate`/`upcomingReleaseDates` decorations.
- [ ] Owner updates details, sets status/publish, uploads ≤10 images, removes an image.
- [ ] Assigned MANAGER updates details, toggles availability, and manages images; cannot create or delete rooms; an unassigned MANAGER → 403.
- [ ] Setting a fully leased room to AVAILABLE → 409; deleting a room with an ACTIVE lease → 409.
- [ ] `lint:check`/`format:check`/`build` pass.
