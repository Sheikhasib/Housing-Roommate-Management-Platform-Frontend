# Spec 17 — Property Manager & Delegation

## Overview

`PROPERTY_MANAGER` is a delegated operator: a verified OWNER assigns a manager to a
property, and the manager then runs day-to-day management of that property. Managers
are **members, not owners** — authorization is membership-based (`PropertyManager`
join row), never `Property.ownerId`. Managers hold **OPERATE**-tier rights only:
they never touch money (no lease termination / refunds / payment visibility), never
create or delete property/units/rooms, and never assign other managers. Owner-tier
actions requiring verified-owner status are unchanged (specs 04/05/06).

Enforcement lives in `src/app/utils/propertyAccess.ts` plus per-module scoped resolvers:
- `resolvePropertyRole(user, propertyId, db?)` → `"OWNER" | "MANAGER" | null` — OWNER requires `user.role === OWNER` **and** ownership of the property (a demoted ex-owner, whose profile/properties survive a role change, keeps no owner powers).
- `propertyManagerScope(userId)` → Prisma `where` fragment for list endpoints scoped to a manager's assigned properties (`{ managers: { some: { manager: { userId, isDeleted: false } } } }`). Owner-scoped lists keep their existing `ownerId` filters; modules branch on role.
- OPERATE-tier writes (room/property updates, images, utility bills) resolve the target resource through a manager-scoped lookup that returns a **generic 404** on any miss (no ownership leak) and reuses the owner validation rules verbatim — delegation, never new powers.
- CONTROL tier (money, deletion, delegation) is enforced by the route role sets (`auth(OWNER, ...)` without PROPERTY_MANAGER) plus the verified-owner guard: managers simply cannot reach those routes.

Owners administer assignments in the property module (spec 05). Manager analytics
live in the analytics module (spec 16). This spec covers the manager's own module +
the delegation tier matrix.

## Depends on

- `prisma/schema/manager.prisma`, `property.prisma`, `user.prisma`, `enums.prisma`
- `src/app/utils/propertyAccess.ts`, `notification.ts`, `audit.ts`
- `src/app/module/manager/*`
- Mount: `/api/v1/manager` in `src/app/app.ts`

## API endpoints (manager module)

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/manager/me` | auth(PROPERTY_MANAGER) | 200 `"Manager profile fetched successfully"` | PROPERTY_MANAGER |
| PATCH | `/api/v1/manager/update-me` | auth(PROPERTY_MANAGER), validateRequest(UpdateManagerProfileZodSchema) | 200 `"Manager profile updated successfully"` | PROPERTY_MANAGER |
| GET | `/api/v1/manager/my-properties` | auth(PROPERTY_MANAGER) | 200 `"Properties fetched successfully"` (meta) | PROPERTY_MANAGER |

## Request/response contracts

**`UpdateManagerProfileZodSchema`** (`.strict()`): `contactNumber` string, `bio` string
max 500 — all optional; empty `{}` is a no-op.

**`my-properties`** query (`IQuery`, raw): page=1, limit=10, sortBy=createdAt,
sortOrder=desc. No search/filter. Response rows (paginated `data` + `meta`): property
`{ id, title, description, type, city, area, images, amenities, createdAt }` with
`_count: { rooms }` (non-deleted) and live non-deleted rooms (selected fields incl.
name/type/monthlyRent/status/isPublished/occupiedBeds/bedCount).

Responses: `me` → full `ManagerProfile` + nested `user` (password omitted);
`update-me` → updated `ManagerProfile`.

## Business rules

- Profile is created automatically at registration (role PROPERTY_MANAGER, spec 01) or
  by a SUPER_ADMIN role change (spec 15); `name`/`email` are denormalized from `User`
  (spec 02). Managers do **not** go through admin verification — assignment by an
  APPROVED OWNER is the trust boundary. A BLOCKED or soft-deleted manager cannot be
  assigned and their existing assignments stop resolving.
- `getMyManagerProfile` — `managerProfile.findUnique({ userId })`; missing → 404
  `"Manager profile not found"`. Includes `user`.
- `updateMyManagerProfile` — resolve by `userId`; single update of `contactNumber`/`bio`.
- `getMyManagedProperties` — `property.findMany({ where: propertyManagerScope(user.userId) })`
  + rooms, `_count`, pagination. No verified-owner check is needed (membership only).
- Manager state-changing actions across modules are resolved through the scoped
  lookups above. Domain-state mutations are **always audit-logged** with
  `actorRole: PROPERTY_MANAGER` (or OWNER, when the owner acts): viewing/application/
  maintenance decisions, room updates + availability (`ROOM_UPDATED`,
  `ROOM_AVAILABILITY_UPDATED`), property updates (`PROPERTY_UPDATED`) and utility
  bills (`UTILITY_BILL_CREATED`). Asset uploads (images/documents) are not audited —
  consistent with lease documents and profile pictures platform-wide.
- Assignment lifecycle (owner side, spec 05): `POST/PATCH` none — `POST
  /property/:propertyId/managers`, `GET /property/:propertyId/managers`,
  `DELETE /property/:propertyId/managers/:managerId` are **OWNER only** and create an
  in-app notification for the manager (`MANAGER_ASSIGNED` / `MANAGER_REMOVED`, SYSTEM).

## Delegation tier matrix

| Capability | OWNER | MANAGER (assigned) | ADMIN/SUPER_ADMIN |
|---|---|---|---|
| Viewing: owner list + status update | yes | yes (spec 07) | yes |
| Application: owner list, detail, review | yes | yes (spec 09) | admin module |
| Maintenance: owner list, status, attach image | yes | yes (spec 13) | yes |
| Room: update details + availability | yes | yes (spec 06) | — |
| Room: vacancy/availability board | yes | yes (counts + dates only, spec 06) | yes |
| Room/property images upload & remove | yes | yes (specs 05/06) | — |
| Property: update fields | yes | yes (spec 05) | — |
| Invoice: utility-bill create, room invoice list | yes | yes (spec 11) | — |
| Lease: view list/detail | yes | yes, view-only (spec 10) | yes |
| Analytics dashboard | owner-analytics | manager-analytics, non-monetary (spec 16) | admin dashboard (spec 15) |
| Property/unit/room create & delete | yes | **no** | owner-delete override |
| Lease termination / deposit refund | yes | **no** | yes |
| Payment visibility / refund reconciliation | yes (owner) | **no** | yes |
| Assign/remove managers | yes | **no** | — |
| Delete lease documents | yes | **no** | yes |

## Data model

`ManagerProfile` (`manager_profiles`): id uuid, `name`, `email` @unique,
`contactNumber?`, `bio?`, soft-delete, timestamps, `userId @unique` → User (cascade);
relations `assignments PropertyManager[]`. `PropertyManager` (`property_managers`): id
uuid, `assignedAt` default now, `propertyId` → Property (cascade, idx),
`managerId` → ManagerProfile (cascade, idx), `@@unique([propertyId, managerId])`. No
soft delete on the join (removal is a row delete). New tables introduced by P1; see
migration `add_property_manager`.

## Definition of done

- [ ] Register a PROPERTY_MANAGER → `ManagerProfile` created; `GET /manager/me` returns it.
- [ ] Owner assigns the manager to their property; the manager sees it in `my-properties` and is notified; a non-OWNER assigning → 403.
- [ ] Assigned manager can update a room's availability and respond to a viewing on that property; an unassigned manager → 403.
- [ ] Manager trying to terminate a lease, delete a room, or open the payment queue → 403.
- [ ] Revoking the assignment removes the manager from every scoped list immediately; the manager is notified.
- [ ] Every manager state change appears in the audit log with the manager as actor.
- [ ] `lint:check`/`format:check`/`build` pass.
