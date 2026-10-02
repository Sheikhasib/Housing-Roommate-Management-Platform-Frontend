# 01: Foundation

Priority: P0 · Build first · Backend spec: 00 (platform overview and conventions)

## Goal
Everything every other spec relies on: the app shell for the 3 areas, the API clients and error handling, auth plumbing, shared components, conventions and environment. No feature page is built here except the shells, `not-found` and `error`.

## Tech used
| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict (no `any`) |
| UI | Tailwind CSS 4, shadcn/ui (Radix), Lucide icons, Sonner toasts |
| Server data | TanStack Query (client), Server Components + `serverApi` (server) |
| Client state | Zustand (sidebar, multi-step form drafts) |
| URL state | `useSearchParams` for page, limit, search, filters, sort |
| HTTP | `ofetch`: `apiClient` (browser) and `serverApi` (server) |
| Forms | `@tanstack/react-form` + Zod 4 |
| Auth | Server Actions + httpOnly cookies + `proxy.ts` (verify JWT, refresh) + `useGetMe` and `<Can>` |
| Charts | Recharts |
| Theme | `next-themes` (light, dark, system); see 18-design-system |
| Social login | `@react-oauth/google` (Continue with Google) |
| Dates | `date-fns` (add only when first needed, ask first) |
| Lint, package manager | ESLint, `npm` only |

## Roles
Backend roles: SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT. Three areas:

| Area | Route prefix | Roles allowed |
|---|---|---|
| Admin | `/admin` | ADMIN, SUPER_ADMIN (SUPER_ADMIN gets extra role management) |
| Owner | `/owner` | OWNER, PROPERTY_MANAGER (manager has a restricted UI, see 17-manager-role) |
| Tenant | `/dashboard` | TENANT |

Role to home: ADMIN, SUPER_ADMIN to `/admin`; OWNER, PROPERTY_MANAGER to `/owner`; TENANT to `/dashboard`.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `not-found.tsx` | Custom 404 | all | Server | P0 |
| `error.tsx` (root and per area) | Error boundary with retry | all | Client | P0 |
| `loading.tsx` (every data route) | Skeleton | all | Server | P0 |
| `(public)/layout.tsx` | Public navbar and footer | all | Server | P0 |
| `(auth)/layout.tsx` | Centered auth layout | guests | Server | P0 |
| `(tenant)`, `(owner)`, `(admin)` layouts | `DashboardShell` with role nav | per area | Server shell, Client nav | P0 |
| `(account)/layout.tsx` | Shell for pages shared by every role (notifications) | any logged-in | Server shell | P0 |

## Endpoints
No endpoint is owned by this spec. Shared behavior it defines is used by every other spec.

## Zod schemas
No feature schemas here. Shared enum values live in `src/validation/enums.ts` (below). Feature schemas mirror the backend per spec.

## Data and state
### API envelope and types
Success: `{ success: true, statusCode, message, data }`. Paginated lists add `meta: { page, limit, total, totalPages }`. Define `ApiSuccess<T>` and `Paginated<T>` once in `src/types/api.ts`. Money fields arrive as strings (Decimal): keep them as strings in types and format at the edge.

### Error contract and `ApiError`
Backend error body: `{ success: false, statusCode, message, errors: [{ field?, message }] }`.
- In production the top-level `message` is masked to "Something went wrong". **Always show `errors[0].message` when present**, fall back to `message`.
- Both clients throw one `ApiError { status, message, errors }`.
- Validation (400): map `errors[].field` to the matching form field; show the rest in a toast.
- 401: client refreshes once (see Auth), then goes to `/login`. 403: toast or `AccessDenied`. 404: not-found state. 409: show the backend message verbatim (many are business rules, e.g. "Room is fully occupied"). 413: "File too large. Maximum 8 MB per file". 429: toast "Too many attempts, try again later" and disable the submit button for a short time. 502: gateway or upload failure, show message and allow retry.
- Never `console.log` responses or tokens.

### Rate limits
Auth POST endpoints: 20 requests per 15 minutes. All other API calls: 300 per 15 minutes. Poll sparingly (notifications: once per 60 seconds).

### Pagination and URL state
- `useUrlState` hook reads and writes `page`, `limit`, `searchTerm`, `sortBy`, `sortOrder` and any filter keys through `useSearchParams` and `router.replace`. Changing a filter resets `page` to 1.
- Defaults: `page=1`, `limit=10` (audit logs: 20). Debounce text search by 400 ms (`useDebounce`).
- `Pagination` component renders from `meta`. Every list syncs to the URL so views can be shared.

### Enums (`src/validation/enums.ts`)
Define as `as const` tuples and derive types. Values:
- Role: SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT
- UserStatus: ACTIVE, BLOCKED, DELETED · Gender: MALE, FEMALE, OTHER
- VerificationStatus: PENDING, APPROVED, REJECTED
- PropertyType: APARTMENT, HOSTEL, DORMITORY, VILLA, SHARED_HOUSE, OTHER
- RoomType: PRIVATE_ROOM, SHARED_ROOM, ENTIRE_FLAT, BED · RoomStatus: AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE
- ApplicationStatus: PENDING, APPROVED, REJECTED, CANCELLED, EXPIRED
- ViewingStatus: PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED · ViewingTimeSlot: MORNING, AFTERNOON, EVENING
- RoommateRequestStatus: PENDING, ACCEPTED, DECLINED · MembershipStatus: PENDING, ACTIVE, REJECTED, REMOVED
- LeaseStatus: ACTIVE, COMPLETED, TERMINATED
- PaymentStatus: UNPAID, PROCESSING, PAID, FAILED, CANCELLED, REFUND_PENDING, REFUNDED · PaymentPurpose: DEPOSIT, RENT, UTILITY · PaymentGateway: BKASH, SSLCOMMERZ, STRIPE
- InvoiceType: RENT, UTILITY · InvoiceStatus: UNPAID, PROCESSING, PAID, FAILED, CANCELLED, REFUNDED
- MaintenanceStatus: OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED · MaintenancePriority: LOW, MEDIUM, HIGH, URGENT · MaintenanceCategory: PLUMBING, ELECTRICAL, APPLIANCE, FURNITURE, PAINTING, CLEANING, OTHER
- NotificationType: APPLICATION, VIEWING, PAYMENT, LEASE, MAINTENANCE, INVOICE, ROOMMATE, SYSTEM
- Gateway request values are lowercase: `bkash`, `sslcommerz`, `stripe`.

### `StatusBadge` color mapping
Single `StatusBadge` component maps any status string to a variant: success (APPROVED, PAID, ACTIVE, AVAILABLE, COMPLETED, RESOLVED, ACCEPTED), warning (PENDING, PROCESSING, UNPAID, RESERVED, REFUND_PENDING), info (ASSIGNED, IN_PROGRESS), danger (REJECTED, FAILED, BLOCKED, TERMINATED, OCCUPIED, URGENT), neutral (CANCELLED, EXPIRED, CLOSED, DECLINED, REMOVED, MAINTENANCE, REFUNDED). Always pair color with text.

### Formatting
- Money: `formatMoney(value: string | number)` in BDT with the taka sign.
- Dates: send ISO strings with offset (`new Date(x).toISOString()` is accepted); display with `Intl.DateTimeFormat`. Never show raw ISO.
- `Decimal` strings must be converted to numbers only for form inputs and charts.

### Uploads
- Backend limits: 8 MB per file. Images: jpeg, png, webp, gif. Documents: those images plus PDF. Wrong MIME gives 400, too large gives 413, wrong field name gives 400.
- Field names are exact: `profileImage` (user avatar), `document` (tenant verification, lease document), `documents` (owner verification, max 5), `images` (property or room gallery, max 10), `image` (maintenance photo, 1).
- `ofetch` cannot report upload progress, so `src/lib/api/upload.ts` exports `uploadWithProgress(url, formData, { method, onProgress })` built on `XMLHttpRequest` against the same-origin `/api/v1` path. It is the **only** allowed exception to "no raw `fetch` to the backend". It returns the same `ApiError` shape.
- Validate size and type on the client before sending. Show a preview (object URL) and a progress bar. Revoke object URLs on unmount.

### Images
Gallery and avatar URLs come from Cloudinary (`res.cloudinary.com`) and Google profile pictures. Add both hosts to `images.remotePatterns` in `next.config.ts`. Always use `next/image` with explicit `sizes`.

### Auth plumbing (full flow in 02-auth)
- Browser calls `/api/v1/...` (same origin), rewritten to `BACKEND_API_URL` by `next.config.ts`. Do not set `output: "export"`.
- Server calls use `serverApi` with `BACKEND_API_URL` and `Authorization: Bearer <accessToken>` read from `cookies()`.
- `proxy.ts`: verify access JWT with `JWT_ACCESS_SECRET`, silently refresh via `POST /auth/refresh-token` using the refresh cookie, redirect by role. Prefixes: `/admin` (ADMIN, SUPER_ADMIN), `/owner` (OWNER, PROPERTY_MANAGER), `/dashboard` (TENANT), `/notifications` (any logged-in). Public: `/`, `/rooms`, `/properties`, `/about`, `/contact`, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/payment/*`. Logged-in users on auth pages go to their home. `proxy.ts` must not run for `/api`.
- Tokens: never in `localStorage`; never logged.

### Layouts and navigation
- `DashboardShell`: collapsible sidebar (Zustand `sidebarOpen`), top bar with notification bell (12-notifications), user menu (profile, logout), and role-aware nav from a single `navConfig` object (`{ label, href, icon, roles }`). Mobile: sidebar becomes a sheet.
- Nav per area:
  - Tenant: Overview `/dashboard`, Applications, Viewings, Leases, Invoices, Payments, Maintenance, Roommates (P1), Profile.
  - Owner and manager: Overview `/owner`, Properties, Rooms, Viewings, Applications, Leases, Invoices, Maintenance, Profile.
  - Admin: Overview `/admin`, Users, Verifications, Properties, Payments, Audit logs, Profile.
- `<Can roles={[...]}>` and `useRole()` hide controls the role may not use. The backend remains the authority (403 handling above).

### Shared components and hooks
Components in `src/components/shared/`: `DataTable` (sortable header, loading skeleton rows, empty state), `StatCard`, `StatusBadge`, `SearchInput`, `EmptyState`, `Pagination`, `ConfirmDialog`, `FileUploader` (preview and progress), `PageHeader`, `RoleGuard`/`Can`, `ErrorState`, `ThemeToggle`, `SiteNavbar`, `SiteFooter`. Hooks in `src/hooks/`: `useGetMe`, `useRole`, `useUrlState`, `useDebounce`, `useMoney` (formatter), `useUnreadCount`.

### Forms, theme and code quality
- Every form (login, register, contact, create and edit room or property, profile update) has: client validation with Zod, server errors mapped to fields, a loading state (spinner and disabled button), a success state (toast plus an inline message or a redirect), and labels connected to inputs (`<Label htmlFor>` with a matching `id`; errors linked with `aria-describedby`).
- `ThemeProvider` from `next-themes` wraps the app and `<html>` gets `suppressHydrationWarning`. Components use tokens only, so both themes work.
- No `console.*` calls in committed code: ESLint `no-console` set to error, and `compiler: { removeConsole: true }` in `next.config.ts` for production builds.
- Public site constants (app name, contact email, phone, address, social URLs) live in `src/lib/constants.ts` with real values from the owner.

### Folder structure
```
src/
  app/ (public)/ (auth)/ (tenant)/dashboard/ (owner)/owner/ (admin)/admin/ (account)/notifications/
       payment/success  payment/cancel  not-found.tsx  error.tsx
  proxy.ts
  lib/api/        apiClient.ts, serverApi.ts, upload.ts, per-module api files
  lib/auth/       session helpers, actions
  store/          Zustand stores
  validation/     enums.ts and Zod schemas mirrored from the backend
  types/          api.ts and per-module types
  hooks/  components/ui/  components/shared/
```
Each route group may hold `_actions/`, `_components/`, `_hooks/`.

### Environment variables
| Variable | Scope | Purpose |
|---|---|---|
| `BACKEND_API_URL` | server | Backend origin for rewrites and server calls |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | server | Must equal the backend values (`proxy.ts` verification) |
| `DEMO_ADMIN_EMAIL` and `_PASSWORD`, `DEMO_OWNER_*`, `DEMO_TENANT_*`, `DEMO_MANAGER_*`, `DEMO_SUPER_ADMIN_*` | server | Demo login (the passwords never leave the server) |
| `NEXT_PUBLIC_DEMO_<ROLE>_EMAIL` (ADMIN, OWNER, TENANT, MANAGER, SUPER_ADMIN) | public | Email shown when a demo button auto-fills the login form (emails only) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | public, required | Google login. The owner creates the OAuth client and adds the local and deployed origins |

### Demo accounts (seeded by the backend on boot)
| Role | Email | Notes |
|---|---|---|
| SUPER_ADMIN | `superadmin@housing.com` | secondary demo button |
| ADMIN | `admin@housing.com` | main demo button |
| OWNER | `owner@housing.com` | APPROVED, has one property and two published rooms |
| PROPERTY_MANAGER | `manager@housing.com` | assigned to the seed owner's property, secondary demo button |
| TENANT | `tenant@housing.com` | identity APPROVED, `lookingForRoommate: true`, can pay |

Passwords come from the backend `.env`; copy them into the frontend server env. These are dedicated demo users, never personal accounts.

## States
Every data route has `loading.tsx` (skeleton matching the final layout), an empty state with an icon and a next action, and an `error.tsx` boundary with retry. API failures also raise a Sonner toast. Never show a blank screen.

## UX notes
- One theme through CSS variable tokens in `globals.css`: one primary color, neutral surfaces, one radius scale, one font. Light and dark mode are both required (see 18-design-system).
- Mobile-first: test 360, 768 and 1280 px. Tables become cards or scroll inside `overflow-x-auto` on mobile.
- Accessibility: labeled inputs, accessible names on icon buttons, visible focus, dialogs trap focus (shadcn default), contrast of AA.
- Public pages export metadata through the Metadata API; dashboards set `robots: noindex`.

## Backend rules the UI must respect
- Soft-deleted rows never appear; the UI needs no "deleted" state.
- Blocked users get 403 on their next request: on 403 with the blocked message, clear the session and go to `/login`.
- Verified-owner and verified-tenant gates exist (see 04-profile, 05-properties, 08-applications, 10-invoices-payments).
- Money statuses change only through gateway callbacks; the UI never marks anything paid.
- `GET /` and `GET /api/v1/health` exist but the UI does not use them.

## Acceptance checklist
- [ ] Project builds with `tsc`, `lint` and `build` passing.
- [ ] Rewrite works: `/api/v1/health` opens through the frontend origin.
- [ ] Cookie smoke test (day 2): login through the Server Action, then a client call to `/api/v1/auth/me` succeeds without any readable token. If it fails, switch to the documented fallback.
- [ ] Upload smoke test (day 2): an 8 MB image uploads through the rewrite on the deployed host. If a platform limit blocks it, compress images on the client first (ask before adding a library).
- [ ] Three shells render the correct nav per role; mobile sidebar works.
- [ ] `ApiError` shows `errors[0].message`; 429 and 413 have friendly messages.
- [ ] `next/image` works for Cloudinary and Google URLs.
- [ ] `useUrlState` keeps filters in the URL and resets `page` on change.
- [ ] The theme toggle switches light, dark and system, and the choice survives a reload.
- [ ] No `console.*` call exists in `src/` and ESLint fails if one is added.
- [ ] A sample form shows validation errors, a loader, a success state and connected labels.

## Out of scope
Feature pages (see specs 02 to 17 and 19), internationalization, offline support.
