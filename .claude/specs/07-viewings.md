# 07: Viewing requests

Priority: P0 · Backend specs: 07 (viewing) · Depends on: 01-foundation, 03-public-rooms

## Goal
Tenants request a viewing of a published room and track or cancel their requests. Owners and assigned managers review requests for their rooms: approve (optionally scheduling), reject with a reason, or mark completed.

## Tech used
`@tanstack/react-form` + Zod for the request dialog and the decision dialogs, TanStack Query with URL-synced status filter, race-safe error handling. Base stack: see 01-foundation.

## Roles
TENANT (create, list own, cancel). OWNER and PROPERTY_MANAGER (list requests for their rooms, decide). ADMIN can change status through the same endpoint but has no list, so there is no admin UI.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/dashboard/viewings` | My viewing requests with status filter and cancel | TENANT | Server + Client | P0 |
| `/owner/viewings` | Requests for my rooms with status and room filters and decision actions | OWNER, PROPERTY_MANAGER | Server + Client | P0 |
| (dialog) `ViewingRequestDialog` | Opened from `/rooms/[roomId]` | TENANT | Client | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| POST | `/api/v1/viewing` | TENANT | CreateViewingRequestZodSchema | Request a viewing |
| GET | `/api/v1/viewing/my-requests` | TENANT | — | Tenant's requests with room and property |
| GET | `/api/v1/viewing/owner-requests` | OWNER, PROPERTY_MANAGER | — | Requests for the owner's or manager's rooms |
| POST | `/api/v1/viewing/:requestId/cancel` | TENANT | — | Tenant cancels while PENDING or APPROVED |
| PATCH | `/api/v1/viewing/:requestId/status` | OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN | UpdateViewingStatusZodSchema | Approve, reject or complete |

## Zod schemas
Source: backend `viewing.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const CreateViewingRequestZodSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  preferredDate: z
    .string("Not a string.")
    .datetime({ offset: true, message: "preferredDate must be a valid date" }),
  timeSlot: z
    .enum(["MORNING", "AFTERNOON", "EVENING"], "Invalid time slot.")
    .optional(),
  message: z
    .string("Not a string.")
    .max(500, "Message must be at most 500 characters")
    .optional(),
});

const UpdateViewingStatusZodSchema = z
  .object({
    status: z.enum(
      ["APPROVED", "REJECTED", "COMPLETED"],
      "Status must be APPROVED, REJECTED or COMPLETED",
    ),
    scheduledDateTime: z
      .string("Not a string.")
      .datetime({
        offset: true,
        message: "scheduledDateTime must be a valid date",
      })
      .optional(),
    rejectionReason: z.string("Not a string.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message:
          "Rejection reason is required when rejecting a viewing request",
      });
    }
  });
```

## Data and state
- Lists accept `page`, `limit`, `status` (both) and `roomId` (owner list), ordered newest first. Keep them in the URL.
- Tenant rows show room, property title and city, `preferredDate`, `timeSlot`, `status`, `scheduledDateTime`, `rejectionReason`. Owner rows show tenant name, email, contact number, occupation and avatar, room name and rent, preferred date and slot, tenant message, status.
- Query keys: `["viewings","mine",params]`, `["viewings","owner",params]`. Mutations invalidate both.
- Time slots: MORNING, AFTERNOON, EVENING.

## States
Skeleton rows; empty states ("You have no viewing requests yet" with a link to `/rooms`; "No viewing requests for your rooms"); error with retry; per-row pending state while a decision is in flight.

## UX notes
- Request dialog: date picker (today or later), time-slot radio group, optional message (counter to 500). Success toast then link to `/dashboard/viewings`.
- Owner actions depend on status: PENDING shows **Approve** (dialog with optional scheduled date and time, defaulting to the preferred date) and **Reject** (reason required); APPROVED shows **Complete**; terminal states show no actions.
- Tenant can **Cancel** only PENDING or APPROVED; confirm first.
- Status filter as segmented tabs with counts only if cheap; otherwise a select.

## Backend rules the UI must respect
- Only published rooms can be requested (404 otherwise). A second PENDING request for the same room gives 409 "You already have a pending viewing request for this room".
- Transitions: PENDING to APPROVED or REJECTED; APPROVED to COMPLETED; PENDING or APPROVED to CANCELLED (tenant). Others return 400 "Cannot move viewing request from X to Y" or 409 "Viewing request is already X".
- A concurrent change returns 409 "Viewing request was updated by someone else. Please refresh and try again." (or "...no longer cancellable..."): refetch the list and keep the dialog closed.
- A manager sees only requests of assigned properties; an unassigned manager gets an empty list and 403 on decisions.
- The tenant is notified on every decision; the owner is notified on create and cancel.

## Acceptance checklist
- [ ] Tenant creates a request from a room page; a duplicate shows the 409 message.
- [ ] Tenant cancels a PENDING and an APPROVED request; others cannot be cancelled.
- [ ] Owner and assigned manager approve (with and without a scheduled time), reject (reason required), and complete an approved request.
- [ ] PENDING cannot be completed (no Complete button).
- [ ] Concurrent-change 409 refreshes the list.
- [ ] Filters and pagination persist in the URL.

## Out of scope
Calendar view, reminders, time-slot conflict detection (the backend does not detect conflicts).
