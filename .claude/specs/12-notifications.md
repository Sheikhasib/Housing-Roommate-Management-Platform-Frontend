# 12: Notifications

Priority: P0 · Backend specs: 14 (notification) · Depends on: 01-foundation

## Goal
Every logged-in user sees an unread badge in the top bar, a quick dropdown, and a full notifications page. Reading is instant (optimistic) and notifications deep-link to the item they describe.

## Tech used
TanStack Query with polling for the unread count, **optimistic updates** for mark-read and mark-all-read, `useUrlState` for the page filters. Base stack: see 01-foundation.

## Roles
Any authenticated user (all 5 roles).

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/notifications` | Full list with read filter and pagination (inside the user's own shell) | any logged-in | Server + Client | P0 |
| (component) `NotificationBell` | Badge and dropdown in the top bar | any logged-in | Client | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/notification/my-notifications` | SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT | — | List (filters page, limit, isRead) |
| GET | `/api/v1/notification/unread-count` | SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT | — | Returns `data: { unreadCount }` |
| PATCH | `/api/v1/notification/read-all` | SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT | — | Returns `data: { updatedCount }` |
| PATCH | `/api/v1/notification/:notificationId/read` | SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT | — | Marks one as read |

## Zod schemas
None. Query values are parsed ad hoc: for the `isRead` filter, send nothing for All, `isRead=false` for Unread and `isRead=true` for Read (the backend treats any value other than `"true"` as unread when the key is present).

## Data and state
- Query keys: `["notifications","unread"]`, `["notifications","list",params]`.
- `NotificationBell` polls `unread-count` every 60 seconds and on window focus. The badge shows `99+` above 99. Rate limits make a faster poll unwise.
- The dropdown shows the latest 5 (`limit=5`) with "Mark all as read" and "View all".
- **Optimistic mark-read:** on click, set `isRead: true` on the cached row and decrement the unread count immediately; roll back and toast on error. Do the same for mark-all-read (set every cached row read and the count to 0). The mark-read response is the updated row.
- A notification has `id`, `type`, `title`, `message`, `data` (JSON), `isRead`, `readAt`, `createdAt`.
- **Deep links** from `data` keys, resolved by role:

| `data` key | Tenant | Owner and manager |
|---|---|---|
| `applicationId` | `/dashboard/applications/[id]` | `/owner/applications/[id]` |
| `leaseId` | `/dashboard/leases/[id]` | `/owner/leases/[id]` |
| `invoiceId` | `/dashboard/invoices` | no link |
| `viewingRequestId` | `/dashboard/viewings` | `/owner/viewings` |
| `maintenanceRequestId` | `/dashboard/maintenance` | `/owner/maintenance` |
| `propertyId` | no link | `/owner/properties/[id]` |

Fallback by `type` when no key matches: APPLICATION, VIEWING, LEASE, MAINTENANCE, INVOICE go to the matching list page of the role; PAYMENT goes to `/dashboard/payments` (tenant); ROOMMATE goes to `/dashboard/roommates` (tenant, P1); SYSTEM has no link.

## States
Skeleton rows; empty state "You're all caught up"; error with retry; unread rows are visually distinct (bold title and a dot).

## UX notes
- Icon per `NotificationType`; relative time ("5 min ago") with the exact time in a tooltip.
- Clicking a notification marks it read and navigates; the page has tabs All, Unread, Read.
- Users can never see another user's notifications; no extra UI is needed.

## Backend rules the UI must respect
- Every query is scoped to the caller. Marking an unknown or someone else's notification gives 404 "Notification not found". Marking is idempotent.
- Notifications are created by other modules; the UI only reads and marks.

## Acceptance checklist
- [ ] Badge shows the unread count and updates within a minute of a new notification.
- [ ] Marking one read and marking all read update the UI instantly and survive a refetch; failures roll back.
- [ ] Filters and pagination persist in the URL.
- [ ] Each notification type opens the right page for each role; missing keys fall back by type.
- [ ] The page works inside the tenant, owner and admin shells.

## Out of scope
Push notifications, websockets, email preferences, deleting notifications.
