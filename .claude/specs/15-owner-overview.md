# 15: Owner and manager overview dashboard

Priority: P0 · Backend specs: 16 (analytics), 17 (manager) · Depends on: 01-foundation, 04-profile, 17-manager-role

## Goal
Owners land on `/owner` and see portfolio health (occupancy, pipeline, earnings). Assigned managers land on the same route and see a non-monetary version for their assigned properties.

## Tech used
Recharts, `StatCard`, role-aware data hook (`useOwnerAnalytics` picks the endpoint by role), TanStack Query. Base stack: see 01-foundation.

## Roles
OWNER (portfolio metrics with money), PROPERTY_MANAGER (assigned properties, no money).

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/owner` | Overview: stat cards, charts, pipeline shortcuts, verification banner (owner) | OWNER, PROPERTY_MANAGER | Server with Client charts | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/analytics/owner-analytics` | OWNER | — | Owner portfolio snapshot (money included) |
| GET | `/api/v1/analytics/manager-analytics` | PROPERTY_MANAGER | — | Manager snapshot for assigned properties (no money) |

Also used here: `GET /api/v1/owner/me` (verification banner).

## Zod schemas
None (no inputs).

## Data and state
- `owner-analytics`: `totalProperties`, `totalRooms`, `publishedRooms`, `totalBeds`, `occupiedBeds`, `occupancyRate`, `activeLeases`, `pendingApplications`, `pendingViewings`, `openMaintenance`, `totalEarnings` (sum of PAID payments), `outstandingRent` (sum of UNPAID RENT invoices).
- `manager-analytics`: `managedProperties`, `totalRooms`, `publishedRooms`, `totalBeds`, `occupiedBeds`, `occupancyRate`, `activeLeases`, `pendingApplications`, `pendingViewings`, `openMaintenance`, `pendingUtilityInvoices`. **No monetary fields.**
- Both are live snapshots: no time series, no parameters.
- Charts (Recharts, snapshot values):
  1. Occupancy: radial or donut of `occupiedBeds` vs vacant (`totalBeds - occupiedBeds`) with `occupancyRate`.
  2. Workload: bar of pending applications, pending viewings, open maintenance (managers also `pendingUtilityInvoices`).
  3. Rooms: published vs unpublished (`publishedRooms`, `totalRooms - publishedRooms`).
  4. Owner only: bar of `totalEarnings` vs `outstandingRent`.
- Workload cards link to `/owner/applications?status=PENDING`, `/owner/viewings?status=PENDING`, `/owner/maintenance?status=OPEN`.

## States
Skeleton; empty states for zero data ("Add your first property" with a link for owners; "No properties assigned yet" for managers); error with retry.

## UX notes
- Owners with a non-APPROVED profile see the verification banner (layout level) and a muted overview.
- Manager overview omits every money card and chart; never render placeholders for money.
- Use `StatCard` with trend-free numbers (snapshots only).

## Backend rules the UI must respect
- `owner-analytics` is OWNER only and `manager-analytics` is PROPERTY_MANAGER only (403 otherwise). A caller without a profile gets 404 ("Owner profile not found" or "Manager profile not found").
- Earnings count only PAID payments; refunded deposits are already excluded. Never subtract refunds again.
- A manager with no assignments gets zeros, not an error.

## Acceptance checklist
- [ ] Owner sees all 12 metrics and four charts with real data.
- [ ] Manager sees 11 non-monetary metrics and three charts; no money anywhere.
- [ ] The hook calls the right endpoint per role and never the wrong one.
- [ ] Shortcut cards open lists with the filter already applied.
- [ ] Skeleton, empty and error states exist.

## Out of scope
Time-series revenue charts, per-property analytics, exports.
