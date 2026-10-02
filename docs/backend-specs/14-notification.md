# Spec 14 — Notifications

## Overview

Read-side inbox for every role. Notifications are **created elsewhere** (specs 01/04/07/08/09/10/11/12/13) through `createNotification` and written straight to the `notifications` table; this module only lists them, counts unread, marks one read, and marks all read — always scoped to the caller. Route/controller/service only (no validation or interface files).

## Depends on

- `prisma/schema/notification.prisma`, `user.prisma`, `enums.prisma`
- `src/app/middleware/checkAuth.ts`
- `src/app/utils/notification.ts` (creation helper — context)
- `src/app/module/notification/*`
- Mount: `/api/v1/notification` in `src/app/app.ts`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| GET | `/api/v1/notification/my-notifications` | auth(all 5 roles) | 200 `"Notifications fetched successfully"` (meta) | Any authenticated user |
| GET | `/api/v1/notification/unread-count` | auth(all 5 roles) | 200 `"Unread notification count fetched successfully"` | Any authenticated user |
| PATCH | `/api/v1/notification/read-all` | auth(all 5 roles) | 200 `"All notifications marked as read"` | Any authenticated user |
| PATCH | `/api/v1/notification/:notificationId/read` | auth(all 5 roles) | 200 `"Notification marked as read"` | Owner only |

## Request/response contracts

No zod schemas; route/query values are parsed ad hoc.

**`my-notifications`** query: page=1, limit=10; optional `isRead` — only when the key is present, `isRead: query.isRead === "true"` (any non-`"true"` value means unread). Order `createdAt desc`. Response `data`: Notification rows; `meta`.

**`unread-count`**: `data: { unreadCount }`.

**`read-all`**: `data: { updatedCount }`.

**`/:notificationId/read`**: missing/not-owned → 404 `"Notification not found"`; response `data`: the updated Notification row.

## Business rules

- Every query is scoped `userId: req.user.userId` — a user can never read another user's notifications.
- `markNotificationAsRead` uses `findFirst({ id, userId })`; ownership failure is reported as 404 (no disclosure). Idempotent on already-read rows.
- `markAllNotificationsAsRead` runs `updateMany({ userId, isRead: false })` setting `{ isRead: true, readAt: new Date() }`.
- Notification record: `id`, `type` (default SYSTEM), `title`, `message`, `data?` (JSON link to the source entity), `isRead` (default false), `readAt?`, `createdAt`, `updatedAt`.

## Data model

`Notification` (`notifications`): id uuid, `type` default SYSTEM, `title`, `message`, `data Json?`, `isRead` default false, `readAt?`, timestamps (no soft delete), `userId` → User (cascade), index `[userId, isRead]`. No schema changes required.

## Definition of done

- [ ] A user lists their notifications (newest first) and filters `isRead=true`/`false`; other users' rows never appear.
- [ ] `unread-count` matches the unread subset; `read-all` zeroes it and returns the count.
- [ ] Marking an unknown or someone else's notification → 404; marking your own flips `isRead` + `readAt`.
- [ ] `lint:check`/`format:check`/`build` pass.
