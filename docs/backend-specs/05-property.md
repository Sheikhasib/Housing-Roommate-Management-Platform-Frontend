# Spec 05 — Property & Units

## Overview

Verified owners build listings as `Property` (a building) optionally containing `Unit`s (flats/apartments), under which rentable `Room`s live (spec 06). The module covers property CRUD, **manager assignment** (an owner delegates an OPERATE-tier `PROPERTY_MANAGER` to a property — spec 17), public marketplace browsing (Redis-cached, spec 00), admin moderation list, per-property image galleries (Cloudinary), and unit CRUD. Soft delete is used for properties and units; ownership is enforced through the verified owner profile, and **assigned managers** may update properties and images via `propertyAccess.ts` but never create/delete properties/units or assign managers.

## Depends on

- `prisma/schema/property.prisma`, `room.prisma`, `owner.prisma`, `manager.prisma`, `enums.prisma`
- `src/app/utils/ownerGuard.ts` (`getVerifiedOwnerProfile`), `propertyAccess.ts` (`propertyManagerScope`), `cloudinaryUpload.ts`, `notification.ts`
- `src/app/lib/multer.ts`, `cloudinary.ts`, `redis.ts`
- `src/app/module/property/*`
- Mount: `/api/v1/property` in `src/app/app.ts`

## API endpoints

All owner mutations call `getVerifiedOwnerProfile` first (404 if no profile; 403 unless APPROVED — message `` `Your owner account is ${status.toLowerCase()}. You can list properties only after an admin approves your account.` ``). MANAGER mutations instead resolve the property through a manager-scoped lookup (`propertyManagerScope`, assigned membership — no verified-owner check needed).

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| POST | `/api/v1/property/` | auth(OWNER), validateRequest(CreatePropertyZodSchema) | 201 `"Property created successfully"` | OWNER (verified) |
| GET | `/api/v1/property/my-properties` | auth(OWNER) | 200 `"Properties fetched successfully"` (meta) | OWNER (verified) |
| GET | `/api/v1/property/all` | auth(ADMIN, SUPER_ADMIN) | 200 `"Properties fetched successfully"` (meta) | ADMIN/SUPER_ADMIN |
| GET | `/api/v1/property/public` | none | 200 `"Properties fetched successfully"` (meta) | Public |
| POST | `/api/v1/property/:propertyId/images` | auth(OWNER, PROPERTY_MANAGER), upload.array("images", 10) | 200 `"Property images uploaded successfully"` | OWNER (verified) or assigned MANAGER |
| DELETE | `/api/v1/property/:propertyId/images` | auth(OWNER, PROPERTY_MANAGER) | 200 `"Property image removed successfully"` | OWNER (verified) or assigned MANAGER |
| POST | `/api/v1/property/:propertyId/units` | auth(OWNER), validateRequest(CreateUnitZodSchema) | 201 `"Unit created successfully"` | OWNER (verified) |
| GET | `/api/v1/property/:propertyId` | optionalAuth (decode-if-present, never rejects) | 200 `"Property fetched successfully"` | Public; owning OWNER, assigned MANAGER + ADMIN/SUPER_ADMIN get the full object |
| PATCH | `/api/v1/property/:propertyId` | auth(OWNER, PROPERTY_MANAGER), validateRequest(UpdatePropertyZodSchema) | 200 `"Property updated successfully"` | OWNER (verified) or assigned MANAGER |
| DELETE | `/api/v1/property/:propertyId` | auth(OWNER, ADMIN, SUPER_ADMIN) | 200 `"Property deleted successfully"` | OWNER or ADMIN |
| PATCH | `/api/v1/property/unit/:unitId` | auth(OWNER), validateRequest(UpdateUnitZodSchema) | 200 `"Unit updated successfully"` | OWNER (verified) |
| DELETE | `/api/v1/property/unit/:unitId` | auth(OWNER) | 200 `"Unit deleted successfully"` | OWNER (verified) |
| POST | `/api/v1/property/:propertyId/managers` | auth(OWNER), validateRequest(AssignManagerZodSchema) | 200 `"Manager assigned successfully"` | OWNER (verified, CONTROL) |
| GET | `/api/v1/property/:propertyId/managers` | auth(OWNER, PROPERTY_MANAGER) | 200 `"Managers fetched successfully"` | OWNER or assigned MANAGER |
| DELETE | `/api/v1/property/:propertyId/managers/:managerId` | auth(OWNER) | 200 `"Manager removed successfully"` | OWNER (verified, CONTROL) |

## Request/response contracts

**`CreatePropertyZodSchema`** (not strict — unknown keys stripped):

| Field | Rule |
|---|---|
| `title` | string required, min 3 (`"Title must be at least 3 characters long"`), max 100 (`"Title must be at most 100 characters long"`) |
| `description` | string max 2000 |
| `type` | enum PropertyType (APARTMENT/HOSTEL/DORMITORY/VILLA/SHARED_HOUSE/OTHER) — `"Invalid property type."` |
| `city` | string required, min 2 (`"City is required"`) |
| `area`, `address`, `houseRules` | string optional |
| `googleMapUrl` | URL (`.url("googleMapUrl must be a valid URL")`) or `""` |
| `latitude` | number optional, -90..90 (`"Latitude must be between -90 and 90"`) |
| `longitude` | number optional, -180..180 (`"Longitude must be between -180 and 180"`) |
| `amenities` | `string[]` |

**`UpdatePropertyZodSchema`** (`.strict()` — unknown keys 400): same fields all optional; title min 3 (`"Title too short"`, no max), description max 2000 (`"Description too long"`), googleMapUrl has no `.url()` check, latitude/longitude optional **and nullable** with the same ranges (an explicit `null` clears the map pin; create stays omit-only).

**`CreateUnitZodSchema`**: `label` required min 1 (`"Unit label is required"`) max 50 (`"Unit label must be at most 50 characters"`), `description` optional, `floor` int min -2 (`"Floor must be -2 or above"`) max 200 (`"Floor seems too high"`). **`UpdateUnitZodSchema`** (strict): `label`/`description`/`floor` (int only).

**`AssignManagerZodSchema`** (not strict): `managerEmail` required, valid email (`"managerEmail must be a valid email"`).

**Images**: upload field `images` (max 10) → 400 `"No images uploaded"`; remove body `{ publicId }` → 400 `"publicId is required"`.

**List query params** (`IQuery`, raw, no zod): page=1, limit=10, sortBy=createdAt, sortOrder=desc.
- `/public` base: `isDeleted: false` AND has ≥1 published non-deleted room. Filters: `searchTerm` (OR contains-insensitive on title/description/area/city), `city` (equality insensitive), `type` (exact enum). Response items are selected: `{ id, title, description, type, city, area, address, latitude, longitude, images, amenities, createdAt, owner: { id, name, companyName, user: { imageUrl } }, rooms (published, sorted rent asc, incl. name/type/monthlyRent/bedCount/occupiedBeds/images/isFurnished), _count: { rooms } (filtered) }`.
- `/my-properties` base: `{ ownerId, isDeleted: false }`; optional `city`; includes units (non-deleted), rooms (non-deleted, selected fields), `_count.rooms` (filtered to non-deleted, matching the visible rooms). (No searchTerm/type.)
- `/all` base `isDeleted: false`; filters: `searchTerm` (title/city), `city`, `type`, `ownerId`; includes owner `{ id, name, email, verificationStatus }` and `_count.rooms` (filtered to non-deleted).

## Business rules

- All owner mutations start with `getVerifiedOwnerProfile`. Property `PATCH`, images upload/remove, and `GET /:propertyId` full view additionally accept an **assigned PROPERTY_MANAGER** resolved through a manager-scoped lookup (spec 17). Property/unit create & delete and manager assignment stay OWNER-only (CONTROL tier).
- `getPropertyDetail(propertyId, viewer?)`: not found/deleted → 404 `"Property not found"`. Guest/TENANT branch returns published rooms only (`units: []`), with the owner trimmed to the public shape `{ id, name, companyName, user: { imageUrl } }` (no `verificationStatus`); the owning OWNER, an assigned MANAGER, and ADMIN/SUPER_ADMIN get the full object; any other authenticated actor (incl. a non-owning OWNER or unassigned MANAGER) → 403 `"You are not allowed to view this property"`. The route uses `optionalAuth` (decode-if-present, never rejects): a missing, invalid, stale, blocked or deleted token silently downgrades to the guest view.
- Property create/update/unit/delete never touch images; `deleteProperty` soft-deletes only the property row (units/rooms/images untouched, but an assigned manager **cannot** delete). Admin bypasses ownership; owner must match `property.ownerId` else 403 `"You can only delete your own properties"`. Unit delete soft-deletes only the unit (OWNER only).
- Images are JSON arrays of `{ url, publicId }`; uploads go to Cloudinary folder `property-images`; remove writes DB first then best-effort Cloudinary destroy.
- **Redis**: `getPublicProperties` caches `property-public:<JSON.stringify({ baseFilter, filters, limit, page, sortBy, sortOrder })>` EX 60s, full `{data, meta}` payload, fail-soft read/write; no invalidation from mutations (≤60s staleness accepted).
- Manager assignment (CONTROL): `assignManager` — property must be owned (owner guard); target `User` must exist with `role: PROPERTY_MANAGER`, status ACTIVE, not soft-deleted → else 404 `"Manager not found"`; already assigned → 409 `"Manager is already assigned to this property"`. Creates the `PropertyManager` row; `writeAuditLog("MANAGER_ASSIGNED")`; SYSTEM notification to the manager. `listManagers` returns `manager { id, name, email, contactNumber, bio, user { imageUrl } }` + `assignedAt` (OWNER or the assigned manager). `removeManager` deletes the join row; `writeAuditLog("MANAGER_REMOVED")`; SYSTEM notification to the manager. Removal never touches rooms/units.

## Data model

`Property` (`properties`): id uuid, `title`, `description?`, `type` default APARTMENT, `city` (idx), `area?`, `address?`, `googleMapUrl?`, `latitude?`/`longitude?` Decimal(9,6) (stored + returned for map pins only; no geo search), `amenities Json?`, `images Json?`, `houseRules?`, soft-delete (+ `idx_property_is_deleted`), timestamps, `ownerId` → OwnerProfile (cascade); relations `units[]`, `rooms[]`, `managers PropertyManager[]`; indexes ownerId, city. `Unit` (`units`): id uuid, `label`, `description?`, `floor Int?`, soft-delete, `propertyId` → Property (cascade), `rooms[]`; index propertyId. Schema changes: `managers` relation + `PropertyManager` table (P1, spec 17); optional `latitude`/`longitude` columns (P4).

## Definition of done

- [ ] Verified OWNER creates a property (201) and lists it in `my-properties`; PENDING owner → 403; TENANT → 403.
- [ ] Public list returns only properties with a published room and honors `searchTerm`/`city`/`type` + `meta`.
- [ ] Admin `all` returns owner + room counts with filters.
- [ ] Owner uploads up to 10 images then removes one by publicId.
- [ ] Public list caches under `property-public:<...>` (repeat call served from Redis, fail-soft).
- [ ] Create/update accepts `latitude`/`longitude` (ranged -90..90 / -180..180; out-of-range → 400) and the public list returns them for map pins.
- [ ] Owner assigns a manager by email → manager notified + appears in `GET /:propertyId/managers`; duplicate assign → 409; email of a non-manager/non-ACTIVE user → 404; assigning as a MANAGER → 403.
- [ ] Assigned MANAGER PATCHes the property and uploads/removes images; cannot delete the property/units or assign another manager.
- [ ] Owner creates/updates/deletes a unit under their property; deleting another owner's property → 403; ADMIN delete soft-deletes.
- [ ] Soft-deleted property/unit disappears from all lists and detail (404).
- [ ] `lint:check`/`format:check`/`build` pass.
