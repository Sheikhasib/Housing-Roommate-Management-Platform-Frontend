# Spec 08 — Roommate Matching, Requests & Post-Lease Memberships

## Overview

TENANT-to-TENANT roommate discovery. A compatibility engine scores other tenants (0–100) against the caller's profile and returns ranked matches (Redis-cached 5 min). Tenants send one-sided requests; the **receiver** accepts or declines. Acceptance atomically creates a normalized `RoommatePair` inside a transaction. Either member can remove a pair. All endpoints are TENANT-only and every notification uses `NotificationType.SYSTEM`.

The module also hosts **post-lease roommate memberships** (P3-Lite): an invited, identity-VERIFIED tenant joins an ACTIVE lease's room as an operational member — they may raise maintenance on the room and view its utility bills (trimmed projection). Memberships are **people, not beds**: they never enter money flows (no Payment/Invoice writes) and never change occupancy counters. A lease hosts at most **1 ACTIVE member** (`MAX_ACTIVE_MEMBERS_PER_LEASE`). Every transition is a guarded conditional write + an atomic audit row (`MEMBERSHIP_INVITED/ACCEPTED/DECLINED/REMOVED`); membership notifications use `NotificationType.ROOMMATE`.

## Depends on

- `prisma/schema/roommate.prisma`, `tenant.prisma`, `enums.prisma`
- `src/app/lib/redis.ts`, `src/app/utils/notification.ts`
- `src/app/module/roommate/*` (canonical 5-file module)
- Mount: `/api/v1/roommate` in `src/app/app.ts`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/roommate/match` | auth(TENANT) | 200 `"Roommate matches fetched successfully"` | TENANT |
| POST | `/api/v1/roommate/request` | auth(TENANT), validateRequest(SendRoommateRequestZodSchema) | 201 `"Roommate request sent successfully"` | TENANT |
| GET | `/api/v1/roommate/my-requests` | auth(TENANT) | 200 `"Roommate requests fetched successfully"` (meta) | TENANT |
| PATCH | `/api/v1/roommate/request/:requestId/respond` | auth(TENANT), validateRequest(RespondRoommateRequestZodSchema) | 200 `"Roommate request updated successfully"` | TENANT (receiver) |
| GET | `/api/v1/roommate/my-pairs` | auth(TENANT) | 200 `"Roommate pairs fetched successfully"` | TENANT |
| DELETE | `/api/v1/roommate/pair/:pairId` | auth(TENANT) | 200 `"Roommate pair removed successfully"` | TENANT (member) |
| POST | `/api/v1/roommate/memberships/invite` | auth(TENANT), validateRequest(InviteMembershipZodSchema) | 201 `"Roommate invitation sent successfully"` | TENANT (lease holder) |
| GET | `/api/v1/roommate/memberships/my` | auth(TENANT) | 200 `"Memberships fetched successfully"` (meta) | TENANT |
| PATCH | `/api/v1/roommate/memberships/:membershipId/respond` | auth(TENANT), validateRequest(RespondMembershipZodSchema) | 200 `"Membership responded successfully"` | TENANT (invitee) |
| POST | `/api/v1/roommate/memberships/:membershipId/leave` | auth(TENANT) | 200 `"Membership ended successfully"` | TENANT (holder or member) |
| POST | `/api/v1/roommate/memberships/:membershipId/remove` | auth(TENANT, OWNER, PROPERTY_MANAGER, ADMIN, SUPER_ADMIN), validateRequest(RemoveMembershipZodSchema) | 200 `"Membership removed successfully"` | Holder / owner / assigned manager / admin |
| GET | `/api/v1/roommate/memberships/:membershipId/utility-bills` | auth(TENANT) | 200 `"Room utility bills fetched successfully"` | TENANT (ACTIVE member or holder) |

## Request/response contracts

**`SendRoommateRequestZodSchema`**: `receiverTenantProfileId` required (`"receiverTenantProfileId is required"`), `message` string max 500 optional.

**`RespondRoommateRequestZodSchema`**: `status` enum `ACCEPTED` \| `DECLINED` (`"Status must be ACCEPTED or DECLINED"`).

**`InviteMembershipZodSchema`**: `leaseId` required (`"leaseId is required"`), `tenantEmail` valid email (`"tenantEmail must be a valid email"`), `message` max 500 optional.

**`RespondMembershipZodSchema`**: `action` enum `ACCEPT` \| `DECLINE` (`"Action must be ACCEPT or DECLINE"`).

**`RemoveMembershipZodSchema`**: `reason` max 300 optional.

**`Query params`** (`my-requests`, `memberships/my`): page=1, limit=10, optional `status`; order `createdAt desc`.

Response shapes:
- `match` → array of `{ id, name, occupation, bio, preferredCity, monthlyBudgetMax, moveInDate, smoker, petFriendly, hasPets, lookingForRoommate, gender, imageUrl, score }` sorted by score desc (no meta).
- `request`/respond → the `RoommateRequest` row; `my-requests` → rows with `sender`/`receiver` trimmed to the match-card shape `{ id, name, imageUrl, occupation, bio, preferredCity, monthlyBudgetMax, moveInDate, smoker, petFriendly, hasPets, gender }` (contact fields never exposed to a counterparty pre-acceptance).
- `my-pairs` → `{ id, createdAt, meTenantProfileId, roommate: { tenantProfileId, name, imageUrl, occupation } }` where `roommate` is always the other tenant.
- `pair/:pairId` delete → `data: { message: "Roommate pair removed successfully" }`.

## Business rules

- Match score weights (both values present): same `preferredCity` (case-insensitive) +30; budget overlap `+25 × min/max`; `smoker` equality +15; both `petFriendly` +10; both `hasPets` +5; pets-vs-not-pet-friendly hard mismatch −30; move-in dates within 45 days +15. Clamped to [0, 100].
- `getMyRoommateMatches` — excludes self, everyone tied to a non-DECLINED non-deleted request (either direction), and current pair members. Candidates must be `lookingForRoommate: true, isDeleted: false`, fetched in a single query regardless of city (ranking depends only on the score; a separate `not` query would wrongly drop NULL-city tenants). Cache key `roommate-match:<tenantProfileId>` EX 300s, fail-soft.
- `sendRoommateRequest` — self-send → 400 `"You cannot send a roommate request to yourself"`; receiver must exist and not be soft-deleted (404 `"Receiver tenant profile not found"`); an existing non-DECLINED request either direction → 409 `"A roommate request already exists between you and this tenant"`; creates PENDING and notifies the receiver (`"New roommate request 🙋"`).
- `respondToRoommateRequest` — only the receiver may respond: else 403 `"You cannot respond to this roommate request"`; non-PENDING → 409 `` `Roommate request has already been ${status.toLowerCase()}` ``. The status flip is a guarded write (conditional `updateMany` keyed on PENDING inside the transaction) so concurrent responses can't both win — a lost race → 409 `"Roommate request is no longer pending. Please refresh and try again."`. ACCEPTED runs in a transaction that also creates `RoommatePair` with normalized `tenantAId < tenantBId` (idempotent check + `@@unique([tenantAId, tenantBId])`). Notifies the sender (`"Roommate request accepted ✅"` / `"Roommate request declined"`).
- `getMyRoommateRequests` — returns sent and received together (PENDING/ACCEPTED/DECLINED), paginated.
- `removeRoommatePair` — hard pair delete (model has no soft delete) in a transaction that also flips any remaining ACCEPTED/PENDING requests between the two tenants (both directions) to DECLINED, so they can freely re-request each other later; non-member → generic 404 `"Roommate pair not found"`; no notification to the other roommate. Does not invalidate the match cache (≤5 min staleness accepted, same as the module's other cache).

## Data model

`RoommateRequest` (`roommate_requests`): id uuid, `message?`, `status` default PENDING, `respondedAt?`, soft-delete, `senderId`/`receiverId` → TenantProfile (named relations, cascade, indexed). `RoommatePair` (`roommate_pairs`): id uuid, timestamps only, `tenantAId`/`tenantBId` → TenantProfile (named relations), `@@unique([tenantAId, tenantBId])`, `applications[]`. `RoommateMembership` (`roommate_memberships`, P3): id uuid, `status` (`MembershipStatus`: PENDING/ACTIVE/REJECTED/REMOVED), `message?`, `respondedAt?`, `joinedAt?`, `removedAt?`, `removedBy?` (User id or `"system-cron"`), `removalReason?`, timestamps, `leaseId` → Lease (cascade), `tenantProfileId` → TenantProfile (cascade), `@@unique([leaseId, tenantProfileId])`, idx tenant/status. No soft delete — the lifecycle is status-driven and every transition is audited.

## Post-lease membership rules (P3-Lite)

State machine: `PENDING → ACTIVE (invitee ACCEPT) | REJECTED (invitee DECLINE) | REMOVED (holder/owner/mgr/admin revoke)`; `ACTIVE → REMOVED (leave: holder or member; remove: any authority; lease TERMINATED/COMPLETED cascade)`. REJECTED/REMOVED are terminal but **re-invitable**: the same unique row is upserted back to PENDING (history lives in the audit log).

- **invite** (holder only) — guards in order: lease exists (404 `"Lease not found"`), ACTIVE (409 `"You can only invite roommates to an active lease"`), caller is the lease holder (403 `"You can only invite roommates to your own active lease"`), invitee is a live TENANT account (user lookup by email requiring `role: TENANT` + `status: ACTIVE` + not deleted, with a tenant profile — else 404 `"Tenant not found"`; role changes never delete profiles, so an ex-tenant OWNER or a BLOCKED user must not receive a dangling invite), not self (400 `"You cannot invite yourself"`), invitee VERIFIED (403 `"Invited tenant is not verified yet"`), no live membership for the invitee (409 `"This tenant already has a live membership on this lease"`), active-member cap free (409 `"This room already has an active roommate member"`), invitee holds no ACTIVE lease on the room (409 `"Invited tenant already holds an active lease on this room"`). Upsert (re-invite reset) + `MEMBERSHIP_INVITED` audit in one transaction; ROOMMATE notification to the invitee after commit (fail-soft).
- **respond** (invitee only) — 403 `"Only the invited tenant can respond"`; non-PENDING → 409 `` `Membership has already been ${status.toLowerCase()}` ``. ACCEPT first takes a row lock (`SELECT ... FOR UPDATE`) on the lease row, serializing competing accepts (and lease termination, whose UPDATE locks the same row) across transactions — then re-checks the cap **inside the transaction** (a racing accept on another invitee loses → 409) and guarded-writes `PENDING → ACTIVE` (+`joinedAt`); DECLINE → REJECTED. Audit `MEMBERSHIP_ACCEPTED`/`MEMBERSHIP_DECLINED`; holder notified, owner also notified on accept (never blindsided).
- **leave** (holder or member, ACTIVE only) — 403 `"Only membership participants can end it"`; non-ACTIVE → 409 `` `Membership is not active (status: ${status.toLowerCase()})` ``; guarded write → REMOVED with `removalReason: "left"`; audit `MEMBERSHIP_REMOVED`; other party + owner notified.
- **remove** (holder / property owner / assigned manager via the property-manager join / ADMIN+) — 403 `"You are not allowed to remove this membership"`; only PENDING/ACTIVE removable (else 409 `` `Membership has already been ${status.toLowerCase()}` ``); guarded write → REMOVED with reason (default `"Removed by property side"`); audit; invitee, holder and owner notified (never the actor).
- **utility-bills** — caller must be the ACTIVE member or the holder (else 403 `"You are not allowed to view these bills"`); returns ONLY `{ id, periodStart, periodEnd, dueDate, amount, status, description }` of **the membership lease's** UTILITY invoices (utility invoices are per-lease shares — another lease's share is another tenant's financial data, even in a shared room) — no `payment`, no lease economics, no PII (money-firewall, read side).
- **memberships/my** — two-sided (`OR: [{ tenantProfileId: me }, { lease: { tenantProfileId: me } }]`); rows carry computed `role: "HOLDER" | "MEMBER"`, trimmed lease/room/property, holder + member in the match-card shape (no contact leak).
- **Invariants**: I1 no membership code writes Payment/Invoice; I2 occupancy counters never touched; I3 max 1 ACTIVE member per lease (unique + in-tx cap check); I4 lease termination (spec 10) and cron completion close live memberships in the same transaction; I5 invitees must be VERIFIED; I6 no status change without an atomic audit row.

## Definition of done

- [ ] TENANT with `lookingForRoommate` gets ranked matches; excluded candidates (active requests/pairs) never appear; repeat call within 5 min hits Redis.
- [ ] Sending a request to self → 400; to an existing active request → 409; receiver gets notification.
- [ ] Receiver accepts → pair created in one transaction; sender notified; second accept of same request → 409.
- [ ] `my-requests` never exposes counterparty `email`/`contactNumber`/`dateOfBirth` (match-card shape only).
- [ ] Member removes a pair (200); the two tenants can immediately send each other a fresh request (underlying requests were declined).
- [ ] Tenants without a `preferredCity` still appear in matches of callers who have one (single candidate query).
- [ ] Holder invites VERIFIED tenant → 201 PENDING + audit + notification; every guard fires with its exact message (self 400, unverified 403, live-duplicate 409, cap 409, co-lease 409, non-holder 403).
- [ ] Accept → ACTIVE (owner notified); a second invitee's accept loses the cap race → 409; decline → REJECTED; re-invite after REJECTED/REMOVED resets the SAME row to PENDING.
- [ ] Member views utility bills → trimmed projection only (no `payment` key); stranger → 403; REMOVED member → 403.
- [ ] Member raises maintenance on the room → 201 attached to the holder's lease (spec 13); holder path unchanged.
- [ ] Leave (holder or member) → REMOVED reason "left"; remove by holder/owner/assigned manager → REMOVED with reason; stranger → 403; already-removed → 409.
- [ ] Lease termination and cron completion cascade memberships to REMOVED (spec 10) with the terminator / `system-cron` as `removedBy` and matching audit rows.
- [ ] `lint:check`/`format:check`/`build` pass.
