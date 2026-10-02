# Spec 16 — Role Analytics Dashboards

## Overview

Live per-role analytics for TENANTs, OWNERs and PROPERTY_MANAGERs (ADMIN/SUPER_ADMIN use the platform dashboard in spec 15). Three endpoints compute current-snapshot counters and money aggregates entirely scoped to the caller's profile (managers: non-monetary, scoped to assigned properties — spec 17). Every value is a fresh DB aggregate — no caching, no date bucketing, no query parameters.

## Depends on

- `prisma/schema/application.prisma`, `lease.prisma`, `payment.prisma`, `invoice.prisma`, `maintenance.prisma`, `roommate.prisma`, `property.prisma`, `room.prisma`, `viewing.prisma`, `enums.prisma`
- `src/app/middleware/checkAuth.ts`
- `src/app/module/analytics/*` (route/controller/service only)
- Mount: `/api/v1/analytics` in `src/app/app.ts`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/analytics/tenant-analytics` | auth(TENANT) | 200 `"Tenant analytics fetched successfully"` | TENANT only |
| GET | `/api/v1/analytics/owner-analytics` | auth(OWNER) | 200 `"Owner analytics fetched successfully"` | OWNER only |
| GET | `/api/v1/analytics/manager-analytics` | auth(PROPERTY_MANAGER) | 200 `"Manager analytics fetched successfully"` | PROPERTY_MANAGER only |

No body, query, or path inputs; no `meta`. Guards: caller without a `TenantProfile`/`OwnerProfile`/`ManagerProfile` → 404 `"Tenant profile not found"` / `"Owner profile not found"` / `"Manager profile not found"`.

## Metrics

**`tenant-analytics`** → data keys:
- `totalApplications` (own, non-deleted)
- `approvedApplications` / `rejectedApplications` (by status; CANCELLED/EXPIRED count in total only)
- `activeLeases` (ACTIVE) / `completedLeases` (COMPLETED or TERMINATED)
- `totalSpent` = Σ amount of PAID payments via own application deposit or invoice→lease
- `outstandingInvoices` (UNPAID) / `totalDue` (Σ amount of those UNPAID invoices)
- `openMaintenance` (status not RESOLVED/CLOSED)
- `roommateCount` (pairs where caller is tenant A or B)

**`owner-analytics`** → data keys (all scoped to `property.ownerId`):
- `totalProperties`, `totalRooms`, `publishedRooms`
- `totalBeds`, `occupiedBeds`, `occupancyRate` (`round(occupied/total×100)` or 0)
- `activeLeases`, `pendingApplications`, `pendingViewings`, `openMaintenance`
- `totalEarnings` = Σ PAID payments (deposits on own applications + invoice payments on own rooms) — refunded deposits have already moved to REFUNDED/REFUND_PENDING, so they net out automatically; never subtract them again.
- `outstandingRent` = Σ amount of UNPAID RENT invoices on own rooms

**`manager-analytics`** → data keys (scoped to the manager's **assigned** properties via `propertyManagerScope`; **no monetary** aggregates — money stays with owners/admins):
- `managedProperties` (count), `totalRooms`, `publishedRooms`
- `totalBeds`, `occupiedBeds`, `occupancyRate` (`round(occupied/total×100)` or 0)
- `activeLeases`, `pendingApplications`, `pendingViewings`, `openMaintenance`
- `pendingUtilityInvoices` (UNPAID UTILITY invoices on the assigned properties' rooms)

## Definition of done

- [ ] A TENANT hits `/tenant-analytics` and sees all keys with correct counts matching the module data (compare against admin dashboard counts for the same account).
- [ ] An OWNER sees property/room/lease/revenue metrics matching their portfolio; a TENANT calling `/owner-analytics` → 403 and vice versa.
- [ ] A PROPERTY_MANAGER sees non-monetary metrics across exactly their assigned properties; TENANT/OWNER → 403.
- [ ] A role without a profile → 404.
- [ ] `lint:check`/`format:check`/`build` pass.
