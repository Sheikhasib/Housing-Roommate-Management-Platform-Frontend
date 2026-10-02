# 06: Rooms, availability and images (owner side)

Priority: P0 · Backend specs: 06 (rooms and availability), 17 (delegation) · Depends on: 01-foundation, 05-properties

## Goal
Owners create, edit, publish and delete rooms; owners and assigned managers update details, set status and publish flags, and manage images; owners, managers and admins read the per-property availability board.

## Tech used
`@tanstack/react-form` + Zod, **optimistic update** for the publish switch (TanStack Query `onMutate` with rollback), `uploadWithProgress`, Recharts or progress bars for the availability summary. Base stack: see 01-foundation.

## Roles
OWNER (all, must be APPROVED), PROPERTY_MANAGER (update details, availability, images, board; cannot create or delete), ADMIN (board read; room delete belongs to the owner in practice).

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/owner/rooms` | Rooms list with filters (status, published, property) | OWNER, PROPERTY_MANAGER | Server + Client | P0 |
| `/owner/rooms/new` | Create room form | OWNER | Client | P0 |
| `/owner/rooms/[roomId]` | Tabs: Details, Availability, Images | OWNER, PROPERTY_MANAGER | Server shell, Client tabs | P0 |
| `/owner/properties/[propertyId]/availability` | Availability board for one property | OWNER, PROPERTY_MANAGER | Server + Client | P1 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| POST | `/api/v1/room` | OWNER | CreateRoomZodSchema | Create room (verified owner) |
| GET | `/api/v1/room/my-rooms` | OWNER | — | Owner's rooms with filters and counts |
| GET | `/api/v1/room/availability/:propertyId` | OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN | — | Availability board (counts and dates only) |
| PATCH | `/api/v1/room/:roomId` | OWNER, PROPERTY_MANAGER | UpdateRoomZodSchema | Update details (owner or assigned manager) |
| PATCH | `/api/v1/room/:roomId/availability` | OWNER, PROPERTY_MANAGER | SetRoomAvailabilityZodSchema | Set status, publish flag, available-from |
| DELETE | `/api/v1/room/:roomId` | OWNER, ADMIN, SUPER_ADMIN | — | Soft delete (owner) |
| POST | `/api/v1/room/:roomId/images` | OWNER, PROPERTY_MANAGER | multipart array("images", max 10) | Upload up to 10 images |
| DELETE | `/api/v1/room/:roomId/images` | OWNER, PROPERTY_MANAGER | — | Remove one image by `publicId` |

Also used here: `GET /api/v1/room/:roomId` (owner, manager and admin see drafts; detail data), `GET /api/v1/property/my-properties` (property picker), `GET /api/v1/manager/my-properties` (manager's rooms come from here), `GET /api/v1/property/:propertyId` (units for the unit picker).

## Zod schemas
Source: backend `room.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const RoomTypeEnum = z.enum(
  ["PRIVATE_ROOM", "SHARED_ROOM", "ENTIRE_FLAT", "BED"],
  "Invalid room type.",
);

const RoomStatusEnum = z.enum(
  ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"],
  "Invalid room status.",
);

const CreateRoomZodSchema = z.object({
  propertyId: z.string().min(1, "propertyId is required"),
  unitId: z.string().optional(),
  name: z
    .string("Not a string.")
    .min(1, "Room name is required")
    .max(50, "Room name must be at most 50 characters"),
  description: z.string("Not a string.").optional(),
  type: RoomTypeEnum.optional(),
  bedCount: z
    .number("bedCount must be a number.")
    .int("bedCount must be an integer.")
    .min(1, "A room must have at least one bed")
    .max(8, "A room can have at most 8 beds")
    .optional(),
  monthlyRent: z
    .number("monthlyRent must be a number.")
    .positive("monthlyRent must be positive"),
  bookingDeposit: z
    .number("bookingDeposit must be a number.")
    .nonnegative("bookingDeposit cannot be negative")
    .optional(),
  minLeaseMonths: z
    .number("minLeaseMonths must be a number.")
    .int()
    .min(1, "minLeaseMonths must be at least 1")
    .max(60, "minLeaseMonths cannot exceed 60")
    .optional(),
  sizeSqft: z
    .number("sizeSqft must be a number.")
    .int()
    .positive("sizeSqft must be positive")
    .optional(),
  isFurnished: z.boolean().optional(),
  amenities: z
    .array(z.string(), "amenities must be an array of strings")
    .optional(),
  availableFrom: z
    .string("Not a string.")
    .datetime({ offset: true, message: "availableFrom must be a valid date" })
    .optional(),
});

const UpdateRoomZodSchema = z
  .object({
    name: z
      .string("Not a string.")
      .min(1, "Room name is required")
      .max(50, "Room name must be at most 50 characters")
      .optional(),
    description: z.string("Not a string.").optional(),
    type: RoomTypeEnum.optional(),
    bedCount: z.number("bedCount must be a number.").int().min(1).optional(),
    monthlyRent: z
      .number("monthlyRent must be a number.")
      .positive("monthlyRent must be positive")
      .optional(),
    bookingDeposit: z
      .number("bookingDeposit must be a number.")
      .nonnegative("bookingDeposit cannot be negative")
      .optional(),
    minLeaseMonths: z
      .number("minLeaseMonths must be a number.")
      .int()
      .min(1)
      .optional(),
    sizeSqft: z
      .number("sizeSqft must be a number.")
      .int()
      .positive()
      .optional(),
    isFurnished: z.boolean().optional(),
    amenities: z
      .array(z.string(), "amenities must be an array of strings")
      .optional(),
  })
  .strict();

const SetRoomAvailabilityZodSchema = z
  .object({
    status: RoomStatusEnum.optional(),
    isPublished: z.boolean().optional(),
    availableFrom: z
      .string("Not a string.")
      .datetime({ offset: true, message: "availableFrom must be a valid date" })
      .optional(),
  })
  .strict();
```

Notes: `UpdateRoomZodSchema` and `SetRoomAvailabilityZodSchema` are `.strict()`. `propertyId`, `unitId` and `availableFrom` cannot change through update; `status`, `isPublished` and `availableFrom` change only through the availability endpoint. Send money and counts as numbers. Dates as ISO with offset.

## Data and state
- Query params for `my-rooms`: `status`, `isPublished` (`"true"` or `"false"`), `propertyId`, `page`, `limit`, `sortBy` (default `createdAt`), `sortOrder` (default `desc`). Rows include `property { id, title, city, images }`, `_count { applications, leases }`, `availableBeds`, `vacantBeds`, `availableNow`, `nextAvailableDate`, `upcomingReleaseDates`.
- **Manager's rooms list:** managers cannot call `my-rooms` (owner only). Build their list from `GET /manager/my-properties`, which includes each property's rooms (name, type, rent, status, published, beds), grouped by property. Updating and availability still use the shared room endpoints.
- Create defaults (backend): `bookingDeposit` = `monthlyRent` when omitted, `bedCount` = 1, `minLeaseMonths` = 1, status AVAILABLE, **unpublished**. After creating, send the owner to `/owner/rooms/[roomId]?tab=images` with a hint "Add photos, then publish".
- **Optimistic update:** the publish switch in the list calls `PATCH /room/:id/availability { isPublished }`; update the cached row immediately, roll back and toast on error.
- Availability board response: `{ property, summary { totalRooms, totalBeds, occupiedBeds, vacantBeds, occupancyRate, fullyVacantRooms, partiallyOccupiedRooms, fullRooms, maintenanceRooms, nextAvailableDate }, rooms[] }`. Dates and counts only, never tenant identities.

## States
Skeleton table; empty state "No rooms yet" with **Create room** for owners (and a hint to create a property first if none exists); managers see "No rooms in your assigned properties yet". Error with retry.

## UX notes
- Room form fields: property (select), unit (select, optional, loaded from the chosen property), name, type, bedCount (1 to 8), monthlyRent, bookingDeposit (hint: defaults to monthly rent), minLeaseMonths (1 to 60), sizeSqft, isFurnished, amenities (tags), description, availableFrom.
- Details tab shows editable fields; Availability tab shows status select, publish switch, availableFrom picker, and a read-only occupancy summary (`occupiedBeds / bedCount`).
- Status badges use `StatusBadge`; occupancy shows a small progress bar.
- Delete (owner only) asks for confirmation. Manager views hide Create and Delete.
- Board: summary stat cards, occupancy radial or bar (Recharts), table of rooms with `vacantBeds`, `availableNow`, `nextAvailableDate`.

## Backend rules the UI must respect
- Owner writes need an APPROVED owner. Managers delegate through assignment and use identical validation; they cannot create or delete rooms (403).
- Setting a fully leased room to AVAILABLE returns 409 "Room is fully occupied by active leases. You cannot mark it available."; deleting a room with an active lease returns 409 "Room cannot be deleted while it has active leases". Show both messages verbatim.
- Creating a unit-scoped room with a unit from another property gives 400 "Unit does not belong to the given property". Room names are unique within a property and unit (a duplicate gives 409 "Duplicate Key Error").
- Occupancy (`occupiedBeds`) changes only through leases and payments; the UI never edits it.
- Board access: an unassigned manager gets 403, a foreign owner gets a generic 404.
- Room detail and public search are cached for 60 seconds on the backend.

## Acceptance checklist
- [ ] Owner creates a room, sees defaults, uploads images, then publishes it; the room appears in `/rooms`.
- [ ] Publish switch updates instantly and rolls back on failure.
- [ ] Owner and assigned manager edit details and availability; manager cannot see Create or Delete.
- [ ] 409 messages for full rooms and active leases display verbatim.
- [ ] Manager's room list comes from `my-properties` and groups by property.
- [ ] Availability board shows counts and dates only.
- [ ] Image upload caps at 10 per request with preview and progress; remove works.

## Out of scope
Bed-level records (the backend tracks counts only), bulk edits, room analytics (15-owner-overview).
