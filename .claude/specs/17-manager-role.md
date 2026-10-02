# 17: Property manager (delegated operator)

Priority: P0 · Backend specs: 17 (manager) · Depends on: 01-foundation, 05-properties, 06-rooms

## Goal
A PROPERTY_MANAGER uses the Owner area with a restricted interface for the properties an owner assigned. This spec defines the manager's own pages and the single permission map that every other spec follows.

## Tech used
A central permission map in `src/lib/permissions.ts` consumed by `navConfig`, `<Can>` and page code; role-aware types (`payment?: ...`); TanStack Query. Base stack: see 01-foundation.

## Roles
PROPERTY_MANAGER (this spec). OWNER and ADMIN appear only in the comparison table.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/owner/profile` (manager variant) | Contact number and bio, plus the shared account section | PROPERTY_MANAGER | Client | P0 |
| `/owner/properties` (manager variant) | Assigned properties from `my-properties` | PROPERTY_MANAGER | Server + Client | P0 |

All other manager pages are the shared Owner pages with restricted controls: overview (15), properties (05), rooms (06), viewings (07), applications (08), leases (09, view-only), invoices (10), maintenance (11).

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/manager/me` | PROPERTY_MANAGER | — | Manager profile with user |
| PATCH | `/api/v1/manager/update-me` | PROPERTY_MANAGER | UpdateManagerProfileZodSchema | Update contact number and bio |
| GET | `/api/v1/manager/my-properties` | PROPERTY_MANAGER | — | Assigned properties with rooms (paginated) |

## Zod schemas
Source: backend `manager.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const UpdateManagerProfileZodSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    bio: z
      .string("Not a string.")
      .max(500, "Bio must be at most 500 characters long")
      .optional(),
  })
  .strict();
```

Note: `.strict()`; send only `contactNumber` and `bio` (max 500).

## Data and state
`my-properties` rows: property `{ id, title, description, type, city, area, images, amenities, createdAt }`, `_count.rooms`, and live rooms with name, type, monthly rent, status, `isPublished`, `occupiedBeds`, `bedCount`. Query `page`, `limit`, `sortBy`, `sortOrder`. This is also the manager's source for the rooms list and the room picker (managers cannot call `GET /room/my-rooms`).

## Permission map (single source of truth)

| Capability | Owner | Manager | Where |
|---|---|---|---|
| View and decide viewings | yes | yes | 07 |
| List, open and review applications | yes | yes (no payment data) | 08 |
| Maintenance list, status, photo | yes | yes | 11 |
| Edit room details, availability, images | yes | yes | 06 |
| Availability board | yes | yes (counts and dates only) | 06 |
| Edit property details and images | yes | yes | 05 |
| Create utility bills, list room invoices | yes | yes (no payment data) | 10 |
| Lease list and detail | yes | yes, **view-only**, no payment data | 09 |
| Analytics | owner-analytics | manager-analytics, no money | 15 |
| Create or delete property, unit, room | yes | **no** | 05, 06 |
| Assign or remove managers | yes | **no** (may view the list) | 05 |
| Terminate lease, upload or delete lease documents | yes | **no** | 09 |
| Payment visibility, refunds | yes (own) | **no** | 08, 09, 10 |
| Owner verification banner and flow | yes | **no** (managers are not verified) | 04 |

Implementation rules:
1. Hide what the manager cannot do (`<Can>`), never just disable it; the backend returns 403 anyway.
2. Types for owner-visible data make `payment` and related money fields optional so manager responses never break rendering.
3. The manager's nav equals the owner's nav (same routes); controls differ.
4. Rooms and the room picker for managers come from `my-properties`, grouped by property.

## States
Unassigned manager (empty `my-properties`): "No properties assigned yet. Ask an owner to assign you using your email address" with the email shown. Loading skeletons and error states as elsewhere.

## UX notes
- A small "Manager" badge near the user menu; a tooltip on hidden-feature areas is not needed (do not show the controls at all).
- Profile page shows contact number and bio with the shared avatar and name section.
- Notifications for assignment and removal arrive as SYSTEM notifications with a `propertyId` (see 12).

## Backend rules the UI must respect
- Managers are members, not owners; authorization is by assignment. A removed or unassigned manager loses access immediately and gets a generic 404 or 403 on scoped resources.
- Managers never touch money: no payment fields, no refunds, no lease termination.
- Managers do not go through admin verification; assignment by an APPROVED owner is the trust boundary. A blocked manager cannot be assigned and existing assignments stop resolving.
- Every manager state change is audit-logged with the manager as actor (admin sees it in 16).
- `manager-analytics` is PROPERTY_MANAGER only.

## Acceptance checklist
- [ ] `manager@housing.com` (seeded, assigned to the demo owner's property) sees assigned properties, rooms, viewings, applications, maintenance, invoices and a read-only leases view.
- [ ] No create or delete property, unit or room, no manager assignment, no lease termination or document controls, no payment data anywhere.
- [ ] Overview shows `manager-analytics` metrics only.
- [ ] Profile page saves contact number and bio with the strict schema.
- [ ] An unassigned manager sees the explanatory empty state, not an error.
- [ ] `src/lib/permissions.ts` is the only place permission rules are defined.

## Out of scope
Manager self-service assignment, manager-to-owner messaging, per-property custom permissions.
