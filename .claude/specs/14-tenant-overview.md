# 14: Tenant overview dashboard

Priority: P0 · Backend specs: 16 (analytics) · Depends on: 01-foundation, 04-profile, 08-applications, 10-invoices-payments

## Goal
The tenant lands on `/dashboard` and immediately sees where they stand (applications, leases, money, maintenance, roommates) and what needs action next.

## Tech used
Recharts for charts, `StatCard`, TanStack Query (or Server Components with `serverApi`) for the snapshot and the action lists, `StatusBadge`. Base stack: see 01-foundation.

## Roles
TENANT.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/dashboard` | Overview: stat cards, charts, next actions, verification banner | TENANT | Server with Client charts | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/analytics/tenant-analytics` | TENANT | — | Snapshot counters and money totals for the caller |

Also used here: `GET /api/v1/application/my-applications` (approved applications waiting for a deposit), `GET /api/v1/invoice/my-invoices` (unpaid invoices), `GET /api/v1/tenant/me` (verification banner).

## Zod schemas
None (no inputs).

## Data and state
- `tenant-analytics` returns: `totalApplications`, `approvedApplications`, `rejectedApplications`, `activeLeases`, `completedLeases` (COMPLETED or TERMINATED), `totalSpent` (sum of PAID payments), `outstandingInvoices` (UNPAID count), `totalDue` (sum of UNPAID invoice amounts), `openMaintenance`, `roommateCount`. All are live snapshots: **no time series, no query parameters**.
- Charts (Recharts, all from snapshot values):
  1. Applications: bar of approved, rejected, other (`total - approved - rejected`).
  2. Leases: donut of active vs completed.
  3. Money: bar of `totalSpent` vs `totalDue`.
- Next actions (from existing list endpoints, `limit=5`): approved applications without a lease ("Pay deposit"), UNPAID invoices ("Pay now"), each linking to the right page.
- Format money with `formatMoney`; counts as plain numbers.

## States
Skeleton stat cards and chart placeholders; empty chart state ("Nothing to show yet") when all values are zero; next-actions empty state "You're all set"; error with retry.

## UX notes
- Top row of 4 stat cards (applications, active leases, total due, open maintenance); remaining metrics in a second row or a compact list.
- Banner when `verificationStatus !== APPROVED` (rendered by the tenant layout).
- Charts need accessible labels and a text summary for screen readers.
- Cards link to their detail pages (applications, leases, invoices, maintenance, roommates).

## Backend rules the UI must respect
- A caller without a tenant profile gets 404 "Tenant profile not found".
- `totalSpent` counts only PAID payments; refunded deposits have already left PAID.
- Another role calling the endpoint gets 403.

## Acceptance checklist
- [ ] All 10 metrics render with correct values for the demo tenant.
- [ ] Three charts render from real data and have empty states.
- [ ] Next-action lists show approved applications and unpaid invoices with working links.
- [ ] The page is responsive and has a skeleton and an error boundary.

## Out of scope
Time-series charts (the backend offers snapshots only), customizable widgets.
