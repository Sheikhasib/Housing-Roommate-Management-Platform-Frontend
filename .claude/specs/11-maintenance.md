# 11: Maintenance requests

Priority: P0 · Backend specs: 13 (maintenance) · Depends on: 01-foundation, 09-leases

## Goal
Tenants with an active lease report maintenance problems and follow them; owners and assigned managers move requests through a forward-only workflow, record resolution notes, and attach photos.

## Tech used
`@tanstack/react-form` + Zod (create form; status form with a client-side rule for resolution notes), `FileUploader` with `uploadWithProgress` for the photo, TanStack Query with URL filters. Base stack: see 01-foundation.

## Roles
TENANT (create, list own, attach a photo to own request). OWNER and PROPERTY_MANAGER (list for their rooms, change status, attach a photo). ADMIN can call the status and image endpoints but has no list, so no admin UI.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/dashboard/maintenance` | My requests with status filter, create dialog, detail drawer | TENANT | Server + Client | P0 |
| `/owner/maintenance` | Requests for my rooms with status and room filters, status actions | OWNER, PROPERTY_MANAGER | Server + Client | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| POST | `/api/v1/maintenance` | TENANT | CreateMaintenanceRequestZodSchema | Create a request (active lease or active roommate member required) |
| GET | `/api/v1/maintenance/my-requests` | TENANT | — | Tenant's requests with room and property |
| GET | `/api/v1/maintenance/owner-requests` | OWNER, PROPERTY_MANAGER | — | Requests for the owner's or manager's rooms |
| PATCH | `/api/v1/maintenance/:requestId/status` | OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN | UpdateMaintenanceStatusZodSchema | Move the request forward |
| POST | `/api/v1/maintenance/:requestId/image` | TENANT, OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN | multipart single("image") | Attach one photo |

Also used here: `GET /api/v1/lease/my-leases` (rooms the tenant can report on: leases with status ACTIVE).

## Zod schemas
Source: backend `maintenance.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const CreateMaintenanceRequestZodSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  category: z
    .enum(
      [
        "PLUMBING",
        "ELECTRICAL",
        "APPLIANCE",
        "FURNITURE",
        "PAINTING",
        "CLEANING",
        "OTHER",
      ],
      "Invalid category.",
    )
    .optional(),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], "Invalid priority.")
    .optional(),
  title: z
    .string("Not a string.")
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string("Not a string.")
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
});

const UpdateMaintenanceStatusZodSchema = z
  .object({
    status: z.enum(
      ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      "Invalid status.",
    ),
    assignedTo: z.string("Not a string.").optional(),
    resolutionNotes: z.string("Not a string.").optional(),
  })
  .strict();
```

Notes: `UpdateMaintenanceStatusZodSchema` is `.strict()`. The frontend adds one rule on top: when `status` is RESOLVED, `resolutionNotes` is required (the backend returns 400 "Resolution notes are required when resolving a request" otherwise). Photo upload: field `image`, one file, jpeg/png/webp/gif, 8 MB.

## Data and state
- Lists accept `page`, `limit`, `status`; the owner list also accepts `roomId`. Newest first, in the URL.
- Create form: room select (rooms of the tenant's ACTIVE leases; from P1 also rooms of ACTIVE roommate memberships, see 13-roommates), category (default OTHER), priority (default MEDIUM), title (3 to 100), description (max 1000). After creation offer "Attach a photo" (second request).
- Allowed next statuses (the UI offers only these):

| Current | Allowed next |
|---|---|
| OPEN | ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED |
| ASSIGNED | IN_PROGRESS, RESOLVED, CLOSED |
| IN_PROGRESS | RESOLVED, CLOSED |
| RESOLVED | CLOSED |
| CLOSED | none (terminal) |

- Status form fields: next status; `assignedTo` (free text, only when moving to ASSIGNED, defaults to the acting user when empty); `resolutionNotes` (required for RESOLVED, kept when moving to CLOSED).
- Owner rows include `tenantProfile { id, name, email, contactNumber, user { imageUrl } }` and `room { id, name }`. Tenant rows include `room` with `property { id, title, city }`.

## States
Skeleton; empty states ("No maintenance requests yet" with a **Report a problem** button; "No requests for your rooms"); a tenant without an active lease sees the create button disabled with "You need an active lease to report a problem"; error with retry.

## UX notes
- Priority badges (LOW neutral, MEDIUM info, HIGH warning, URGENT danger) and a status stepper (Open, Assigned, In progress, Resolved, Closed).
- Detail drawer shows photo, description, assignment (`assignedTo`, `assignedAt`), `resolutionNotes`, `resolvedAt`.
- A second photo upload overwrites the first; warn before replacing.

## Backend rules the UI must respect
- Creating requires an ACTIVE lease on that room, or an ACTIVE roommate membership (the request attaches to the holder's lease); otherwise 403 "You need an active lease on this room to report maintenance".
- The state machine is forward-only; any other move gives 400 "Cannot move request from X to Y". CLOSED is terminal.
- Only the room owner, an assigned manager, or an admin can change status (403 otherwise). Photo upload also allows the reporting tenant.
- The tenant is notified and emailed on every status change; the owner is notified on create.
- Maintenance never changes the room's MAINTENANCE status. There is no admin-wide list and no delete.

## Acceptance checklist
- [ ] Tenant with an active lease creates a request and attaches a photo; a tenant without one is blocked.
- [ ] Owner and assigned manager walk the workflow; the UI offers only allowed next statuses; RESOLVED requires notes.
- [ ] CLOSED requests offer no actions.
- [ ] Filters and pagination persist in the URL.
- [ ] An unrelated user cannot attach a photo (403 message shown).

## Out of scope
Vendor management, SLA timers, chat, deleting requests.
