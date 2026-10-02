# 05: Properties, units and managers (owner side)

Priority: P0 · Backend specs: 05 (property and units), 17 (delegation) · Depends on: 01-foundation, 04-profile

## Goal
Verified owners create and maintain properties (with a multi-step wizard), upload galleries, manage units, and assign or remove property managers. Assigned managers can edit property details and images but nothing else.

## Tech used
`@tanstack/react-form` + Zod with a **multi-step wizard** persisted in a Zustand store (`usePropertyWizardStore`), `uploadWithProgress` and `FileUploader`, TanStack Query lists with URL state, `ConfirmDialog` for destructive actions. Base stack: see 01-foundation.

## Roles
OWNER (full, must be APPROVED), PROPERTY_MANAGER (edit details and images of assigned properties, list managers, nothing else), ADMIN (moderation lives in 16-admin).

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/owner/properties` | My properties list with city filter and pagination (manager sees assigned ones) | OWNER, PROPERTY_MANAGER | Server + Client filters | P0 |
| `/owner/properties/new` | Create wizard: 1 details, 2 units (optional), 3 images, 4 review | OWNER | Client | P0 |
| `/owner/properties/[propertyId]` | Detail with tabs: Overview (edit), Images, Units, Managers | OWNER, PROPERTY_MANAGER | Server shell, Client tabs | P0 |

Tab visibility: Units and the assign or remove actions in Managers are OWNER only; the manager sees the managers list read-only. "Delete property" is OWNER only.

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| POST | `/api/v1/property` | OWNER | CreatePropertyZodSchema | Create property (verified owner) |
| GET | `/api/v1/property/my-properties` | OWNER | — | Owner's properties with units, rooms and counts |
| POST | `/api/v1/property/:propertyId/images` | OWNER, PROPERTY_MANAGER | multipart array("images", max 10) | Upload up to 10 images |
| DELETE | `/api/v1/property/:propertyId/images` | OWNER, PROPERTY_MANAGER | — | Remove one image by `publicId` |
| POST | `/api/v1/property/:propertyId/units` | OWNER | CreateUnitZodSchema | Create unit |
| PATCH | `/api/v1/property/:propertyId` | OWNER, PROPERTY_MANAGER | UpdatePropertyZodSchema | Update property (owner or assigned manager) |
| DELETE | `/api/v1/property/:propertyId` | OWNER, ADMIN, SUPER_ADMIN | — | Soft delete (owner) |
| PATCH | `/api/v1/property/unit/:unitId` | OWNER | UpdateUnitZodSchema | Update unit |
| DELETE | `/api/v1/property/unit/:unitId` | OWNER | — | Delete unit |
| POST | `/api/v1/property/:propertyId/managers` | OWNER | AssignManagerZodSchema | Assign manager by email |
| GET | `/api/v1/property/:propertyId/managers` | OWNER, PROPERTY_MANAGER | — | List managers |
| DELETE | `/api/v1/property/:propertyId/managers/:managerId` | OWNER | — | Remove manager |

Also used here: `GET /api/v1/property/:propertyId` (full view when logged in as owner or assigned manager) and `GET /api/v1/manager/my-properties` (manager list, owned by 17-manager-role).

## Zod schemas
Source: backend `property.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const PropertyTypeEnum = z.enum(
  ["APARTMENT", "HOSTEL", "DORMITORY", "VILLA", "SHARED_HOUSE", "OTHER"],
  "Invalid property type.",
);

const CreatePropertyZodSchema = z.object({
  title: z
    .string("Not a string.")
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must be at most 100 characters long"),
  description: z
    .string("Not a string.")
    .max(2000, "Description must be at most 2000 characters long")
    .optional(),
  type: PropertyTypeEnum.optional(),
  city: z.string("Not a string.").min(2, "City is required"),
  area: z.string("Not a string.").optional(),
  address: z.string("Not a string.").optional(),
  googleMapUrl: z
    .string("Not a string.")
    .url("googleMapUrl must be a valid URL")
    .optional()
    .or(z.literal("")),
  latitude: z
    .number("Latitude must be a number.")
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number("Longitude must be a number.")
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  amenities: z
    .array(z.string(), "amenities must be an array of strings")
    .optional(),
  houseRules: z.string("Not a string.").optional(),
});

const UpdatePropertyZodSchema = z
  .object({
    title: z.string("Not a string.").min(3, "Title too short").optional(),
    description: z
      .string("Not a string.")
      .max(2000, "Description too long")
      .optional(),
    type: PropertyTypeEnum.optional(),
    city: z.string("Not a string.").min(2, "City is required").optional(),
    area: z.string("Not a string.").optional(),
    address: z.string("Not a string.").optional(),
    googleMapUrl: z.string("Not a string.").optional().or(z.literal("")),
    latitude: z
      .number("Latitude must be a number.")
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .nullable()
      .optional(),
    longitude: z
      .number("Longitude must be a number.")
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .nullable()
      .optional(),
    amenities: z
      .array(z.string(), "amenities must be an array of strings")
      .optional(),
    houseRules: z.string("Not a string.").optional(),
  })
  .strict();

const CreateUnitZodSchema = z.object({
  label: z
    .string("Not a string.")
    .min(1, "Unit label is required")
    .max(50, "Unit label must be at most 50 characters"),
  description: z.string("Not a string.").optional(),
  floor: z
    .number("Floor must be a number.")
    .int()
    .min(-2, "Floor must be -2 or above")
    .max(200, "Floor seems too high")
    .optional(),
});

const UpdateUnitZodSchema = z
  .object({
    label: z
      .string("Not a string.")
      .min(1, "Unit label is required")
      .optional(),
    description: z.string("Not a string.").optional(),
    floor: z.number("Floor must be a number.").int().optional(),
  })
  .strict();

const AssignManagerZodSchema = z.object({
  managerEmail: z.email("managerEmail must be a valid email"),
});
```

Notes: `UpdatePropertyZodSchema` and `UpdateUnitZodSchema` are `.strict()`: send only listed keys. `latitude` and `longitude` accept `null` on update to clear a pin but are omit-only on create. Image remove uses JSON `{ publicId }`.

## Data and state
- Wizard store holds `{ step, details, units[], images[] (File objects, not persisted), propertyId? }`. Details and units survive a refresh through the store (session storage persistence is allowed for drafts only, no tokens or files). Clear on success.
- Create sequence on "Create": `POST /property` then, for each unit, `POST /property/:id/units`, then image uploads. Show a checklist with per-step status. After step 1 succeeds keep `propertyId`; if a later step fails, show "Retry from here" and a link to the property detail where the remaining work can be finished. Never create a second property on retry.
- Queries: `["properties","mine",params]`, `["property",id]`. Mutations invalidate both.
- List cards show cover image, title, city, type badge, room count (`_count.rooms`), and quick actions.
- Detail data comes from `GET /property/:propertyId` through `serverApi` with the user's token: owners and assigned managers get the full object (all non-deleted rooms, units, full owner).

## States
Skeleton list; empty state "No properties yet" with a **Create property** button (owner) or "No properties assigned yet. Ask an owner to assign you by email." (manager); error with retry. Pending owner: creation controls are disabled and a banner links to verification.

## UX notes
- Wizard shows a stepper, Back and Next, inline validation per step (validate step fields with the matching part of `CreatePropertyZodSchema`), and a final review card.
- Amenities and house rules: tag input for amenities (string array), textarea for rules.
- Coordinates are optional numbers; also allow a Google Maps URL (`googleMapUrl`, empty string allowed). Show "Open in Google Maps" from the URL or coordinates.
- Image grid with remove buttons (confirm), upload progress, preview. Disable upload when 10 images are reached.
- Managers tab: email input, list with avatar, name, email, contact number, bio, `assignedAt`, and a remove button (confirm).
- Delete property: confirm dialog stating that rooms and units stay but the property disappears.

## Backend rules the UI must respect
- Creation and owner-only mutations require an APPROVED owner (403 otherwise). A PROPERTY_MANAGER cannot create or delete properties or units and cannot assign managers.
- `type` defaults to APARTMENT when omitted. Images are `{ url, publicId }` arrays; up to 10 per upload request.
- Assign manager: the target must be an ACTIVE PROPERTY_MANAGER user (404 "Manager not found" otherwise); duplicate gives 409 "Manager is already assigned to this property". The manager is notified on assign and remove.
- Delete property soft-deletes only the property; deleting another owner's property gives 403. Admin delete is in 16-admin.
- A manager scope miss returns a generic 404; show "Property not found".
- Owner lists: `my-properties` includes non-deleted units and rooms, with `_count.rooms` matching the visible rooms.

## Acceptance checklist
- [ ] Verified owner completes the wizard (details, 2 units, 3 images) and lands on the new property detail.
- [ ] A failed unit or image step does not duplicate the property and can be retried.
- [ ] Owner edits details, adds and removes images (max 10), manages units, assigns and removes a manager.
- [ ] Assigned manager edits details and images; the Units tab, delete, and assign controls are hidden; direct calls would 403.
- [ ] Pending owner sees disabled creation controls and the verification banner.
- [ ] List filters by city and paginates through the URL.
- [ ] Destructive actions ask for confirmation and show toasts.

## Out of scope
Map embeds, bulk import, property analytics (see 15-owner-overview), admin moderation (16-admin).
