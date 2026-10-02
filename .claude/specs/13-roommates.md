# 13: Roommates (matching, requests, pairs, memberships)

Priority: P1 (build after all P0 specs) · Backend specs: 08 (roommate) · Depends on: 01-foundation, 04-profile, 09-leases

## Goal
Tenants find compatible roommates (ranked 0 to 100), send and answer requests, manage pairs, and, as lease holders, invite a verified tenant to join an active lease as an operational member who can report maintenance and see the room's utility bills.

## Tech used
`@tanstack/react-form` + Zod for requests, invitations and removal reasons; TanStack Query with tabbed views kept in the URL (`?tab=`); `ConfirmDialog`. Base stack: see 01-foundation.

## Roles
TENANT only. Owners, managers and admins have API access to membership removal but no endpoint lists memberships for them, so they have no UI in this spec.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/dashboard/roommates` | Tabs: Matches, Requests, Pairs, Memberships | TENANT | Server shell, Client tabs | P1 |
| `/dashboard/roommates/memberships/[membershipId]` | Membership detail: utility bills (trimmed), leave or remove | TENANT | Server + Client | P1 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/roommate/match` | TENANT | — | Ranked matches (array, no pagination, cached 5 min) |
| POST | `/api/v1/roommate/request` | TENANT | SendRoommateRequestZodSchema | Send a request |
| GET | `/api/v1/roommate/my-requests` | TENANT | — | Sent and received requests (paginated) |
| PATCH | `/api/v1/roommate/request/:requestId/respond` | TENANT | RespondRoommateRequestZodSchema | Receiver accepts or declines |
| GET | `/api/v1/roommate/my-pairs` | TENANT | — | Current pairs |
| DELETE | `/api/v1/roommate/pair/:pairId` | TENANT | — | Remove a pair |
| POST | `/api/v1/roommate/memberships/invite` | TENANT | InviteMembershipZodSchema | Holder invites a tenant to an active lease |
| GET | `/api/v1/roommate/memberships/my` | TENANT | — | My memberships as holder or member (paginated) |
| PATCH | `/api/v1/roommate/memberships/:membershipId/respond` | TENANT | RespondMembershipZodSchema | Invitee accepts or declines |
| POST | `/api/v1/roommate/memberships/:membershipId/leave` | TENANT | — | Holder or member ends an ACTIVE membership |
| POST | `/api/v1/roommate/memberships/:membershipId/remove` | TENANT, OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN | RemoveMembershipZodSchema | Holder removes (owner, manager and admin paths have no UI) |
| GET | `/api/v1/roommate/memberships/:membershipId/utility-bills` | TENANT | — | Trimmed utility bills of the membership lease |

Also used here: `GET /api/v1/lease/my-leases` (active leases for the invite form), `GET /api/v1/tenant/me` (`lookingForRoommate`).

## Zod schemas
Source: backend `roommate.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const SendRoommateRequestZodSchema = z.object({
  receiverTenantProfileId: z
    .string()
    .min(1, "receiverTenantProfileId is required"),
  message: z
    .string("Not a string.")
    .max(500, "Message must be at most 500 characters")
    .optional(),
});

const RespondRoommateRequestZodSchema = z.object({
  status: z.enum(
    ["ACCEPTED", "DECLINED"],
    "Status must be ACCEPTED or DECLINED",
  ),
});

const InviteMembershipZodSchema = z.object({
  leaseId: z.string().min(1, "leaseId is required"),
  tenantEmail: z.email("tenantEmail must be a valid email"),
  message: z
    .string("Not a string.")
    .max(500, "Message must be at most 500 characters")
    .optional(),
});

const RespondMembershipZodSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"], "Action must be ACCEPT or DECLINE"),
});

const RemoveMembershipZodSchema = z.object({
  reason: z
    .string("Not a string.")
    .max(300, "Reason must be at most 300 characters")
    .optional(),
});
```

## Data and state
- **Matches** (array): `{ id, name, occupation, bio, preferredCity, monthlyBudgetMax, moveInDate, smoker, petFriendly, hasPets, lookingForRoommate, gender, imageUrl, score }` sorted by `score` descending. `id` is the tenant profile id used as `receiverTenantProfileId`. Requires the caller's `lookingForRoommate` to be true; otherwise show a prompt linking to the profile.
- **Requests**: `page`, `limit`, `status`; rows carry `sender` and `receiver` in the trimmed match-card shape (never email, phone or date of birth). Only the receiver of a PENDING request can respond.
- **Pairs**: `{ id, createdAt, meTenantProfileId, roommate { tenantProfileId, name, imageUrl, occupation } }`; `roommate` is always the other tenant. Removing a pair also declines remaining requests between the two, so they may request again.
- **Memberships** (`memberships/my`: `page`, `limit`, `status`): rows have computed `role` HOLDER or MEMBER, trimmed lease, room, property, and holder and member in the match-card shape.
- Invite form: lease (select among the holder's ACTIVE leases), invitee email, optional message (500).
- Utility bills projection only: `{ id, periodStart, periodEnd, dueDate, amount, status, description }`.
- Pairs feed the optional `roommatePairId` of the apply dialog (08-applications). Active memberships feed the room list of the maintenance create form (11-maintenance).

## States
Skeleton cards; empty states per tab ("No matches yet", "No requests", "No pairs", "No memberships"); the Matches tab explains when matching is off; error with retry.

## UX notes
- Match card: avatar, name, occupation, city, budget, move-in date, lifestyle chips (smoker, pets), score ring or bar, **Send request** button with a message dialog.
- Requests tab splits Received and Sent with status badges and Accept or Decline on received PENDING requests.
- Memberships tab shows invitations awaiting my answer first, then active ones with Leave, and for holders a Remove action (reason optional, 300).

## Backend rules the UI must respect
- Request guards: not to yourself (400), receiver must exist (404), an existing non-declined request in either direction gives 409 "A roommate request already exists between you and this tenant". Respond is receiver-only (403) and only while PENDING (409); a concurrent response gives 409 "Roommate request is no longer pending…".
- Match scoring is server-side; excluded candidates (active requests, pairs) never appear. Results may be up to 5 minutes stale.
- Invite guards (show verbatim): lease must be ACTIVE (409), caller must be the holder (403), invitee must be an ACTIVE tenant account (404 "Tenant not found"), not yourself (400), invitee must be verified (403 "Invited tenant is not verified yet"), no live membership (409), active-member cap of 1 (409 "This room already has an active roommate member"), invitee not already a leaseholder on the room (409).
- Accept can lose a race for the cap (409). Decline gives REJECTED; REJECTED and REMOVED memberships can be re-invited (the same row returns to PENDING).
- Leave needs an ACTIVE membership and participation (403 or 409 otherwise). Utility bills are visible only to the ACTIVE member or the holder (403 otherwise) and contain no payment data.
- Memberships never touch money or occupancy; lease termination or completion removes them automatically.

## Acceptance checklist
- [ ] A tenant with matching on sees ranked matches, sends a request, and the receiver accepts; a pair appears for both.
- [ ] Removing a pair lets both send fresh requests immediately.
- [ ] Request lists never show email or phone.
- [ ] Holder invites a verified tenant; every guard message displays verbatim.
- [ ] Invitee accepts, declines, and a declined invitee can be re-invited.
- [ ] Member opens the trimmed utility bills and reports maintenance on the room.
- [ ] Leave and remove behave as described; a stranger gets the 403 message.

## Out of scope
Owner, manager and admin membership removal UI (no list endpoint exists for them), chat, roommate reviews.
