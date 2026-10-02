# Frontend spec coverage

Generated from the 18 backend specs, the backend route files and `docs/update-1-requirements.md`. It shows that no backend capability was left out and how the frontend work is split.

## Summary

- Backend specs: 18 (00 to 17). Frontend specs: 19 (`.claude/specs/01` to `19`). Spec 18 holds visual rules only; spec 19 holds the static pages.
- Endpoints: 115 in total, **115 covered, 0 left out, none claimed twice**.
  - 110 exist in the code snapshot; 4 come from the backend specs only: the availability board (`GET /room/availability/:propertyId`, newer than the snapshot) and three gateway routes mounted in `app.ts` (`confirm`, `ipn`, `webhook/stripe`).
  - 1 is new and does not exist yet: `POST /contact` (backend change B2), used by the contact form in spec 19.
  - 4 are never called from the UI (gateway to backend): see spec 10.
  - 1 has no owner, manager or admin UI: `POST /roommate/memberships/:membershipId/remove` is used only on the holder path, because no endpoint lists memberships for them.
- Pages: **54** unique routes (**43 P0**, 11 P1). The assignment minimum is 18, so P1 pages and the P1 parts of specs can be cut first if time runs short.

## Backend spec to frontend spec

| Backend spec | Frontend spec |
|---|---|
| 00 platform overview and conventions | 01-foundation |
| 01 auth | 02-auth |
| 02 user | 04-profile |
| 03 tenant | 04-profile |
| 04 owner | 04-profile (profile, documents), 16-admin (review) |
| 05 property | 03-public-rooms (public), 05-properties (owner), 16-admin (moderation) |
| 06 room | 03-public-rooms (public), 06-rooms (owner and manager) |
| 07 viewing | 07-viewings |
| 08 roommate | 13-roommates (P1) |
| 09 application | 08-applications |
| 10 lease | 09-leases |
| 11 invoice | 10-invoices-payments |
| 12 payment | 10-invoices-payments (tenant), 16-admin (admin queues) |
| 13 maintenance | 11-maintenance |
| 14 notification | 12-notifications |
| 15 admin | 16-admin |
| 16 analytics | 14-tenant-overview, 15-owner-overview |
| 17 manager | 17-manager-role (the permission map is used by 05, 06, 07, 08, 09, 10, 11, 15) |
| none (new in Update-1: contact form) | 19-static-pages with backend change B2 |

## Pages by spec

| Spec | Routes (priority) |
|---|---|
| 01-foundation | none (shared shells or visual rules only) |
| 02-auth | `/login` (P0), `/register` (P0), `/verify-email` (P0), `/forgot-password` (P1), `/reset-password` (P1) |
| 03-public-rooms | `/` (P0), `/rooms` (P0), `/rooms/[roomId]` (P0), `/properties` (P1), `/properties/[propertyId]` (P1) |
| 04-profile | `/dashboard/profile` (P0), `/owner/profile` (P0), `/admin/profile` (P0) |
| 05-properties | `/owner/properties` (P0), `/owner/properties/new` (P0), `/owner/properties/[propertyId]` (P0) |
| 06-rooms | `/owner/rooms` (P0), `/owner/rooms/new` (P0), `/owner/rooms/[roomId]` (P0), `/owner/properties/[propertyId]/availability` (P1) |
| 07-viewings | `/dashboard/viewings` (P0), `/owner/viewings` (P0) |
| 08-applications | `/dashboard/applications` (P0), `/dashboard/applications/[applicationId]` (P1), `/owner/applications` (P0), `/owner/applications/[applicationId]` (P1) |
| 09-leases | `/dashboard/leases` (P0), `/dashboard/leases/[leaseId]` (P0), `/owner/leases` (P0), `/owner/leases/[leaseId]` (P1) |
| 10-invoices-payments | `/dashboard/invoices` (P0), `/dashboard/payments` (P0), `/dashboard/payments/[paymentId]` (P1), `/owner/invoices` (P0), `/payment/success` (P0), `/payment/cancel` (P0) |
| 11-maintenance | `/dashboard/maintenance` (P0), `/owner/maintenance` (P0) |
| 12-notifications | `/notifications` (P0) |
| 13-roommates | `/dashboard/roommates` (P1), `/dashboard/roommates/memberships/[membershipId]` (P1) |
| 14-tenant-overview | `/dashboard` (P0) |
| 15-owner-overview | `/owner` (P0) |
| 16-admin | `/admin` (P0), `/admin/users` (P0), `/admin/verifications` (P0), `/admin/properties` (P0), `/admin/payments` (P0), `/admin/audit-logs` (P0) |
| 17-manager-role | `/owner/profile` (P0), `/owner/properties` (P0) |
| 18-design-system | none (shared shells or visual rules only) |
| 19-static-pages | `/about` (P0), `/contact` (P0), `/help` (P0), `/privacy` (P0), `/terms` (P0) |

## Update-1 requirements map

Each rule of `docs/update-1-requirements.md` and where it is built.

| Requirement | Where | Status |
|---|---|---|
| At most 3 brand colors, light and dark mode | 18-design-system, 01-foundation | Covered: teal, indigo, amber plus neutrals; red only for errors; dark tokens measured |
| Same size and style for all cards | 18-design-system, 03-public-rooms | Covered |
| Forms: validation, errors, success, loaders, labels | 01-foundation (forms rules), each feature spec | Covered |
| Responsive, no placeholder content | 01, 18, CLAUDE.md | Covered |
| Navbar: full-width, sticky, at least 4 routes logged out and 6 logged in, dropdown | 18-design-system | Covered |
| Hero 60 to 70 percent with slider, CTA and flow to the next section | 18-design-system, 03-public-rooms | Covered |
| At least 8 home sections | 03-public-rooms (10 sections) | Covered. Testimonials, newsletter and blog are skipped: no backend data, they would be dummy content |
| Footer with working links, contact and social links | 18-design-system, 19-static-pages | Covered; needs the owner's real contact details and social URLs |
| Cards with image, title, description, meta, View details; 3 per row; skeleton | 03-public-rooms, 18-design-system | Covered |
| Public details page with sections, related items | 03-public-rooms | Covered; reviews are not applicable (no backend reviews) |
| Explore page: search, at least 2 filters, sort, pagination | 03-public-rooms | Covered |
| Login and registration, demo button that auto-fills | 02-auth | Covered (the password is masked and stays on the server) |
| Social login | 02-auth | Covered with Google; Facebook is not supported by the backend |
| Role-based dashboards, sidebar items, profile dropdown | 01-foundation (nav), 18-design-system | Covered: tenant 9 items, owner 9, admin 7 |
| Overview cards, charts from live data | 14-tenant-overview, 15-owner-overview, 16-admin | Covered |
| Tables with filtering and pagination | 05 to 11, 16 | Covered |
| Editable profile page | 04-profile | Covered |
| 2 to 3 additional pages | 19-static-pages | Covered: About, Contact, Help, Privacy, Terms |
| Forms: login, registration, contact, create item, edit item, profile update | 02, 19, 05 and 06, 04 | Covered; the contact form needs backend change B2 |
| Backend stack, security, modular structure | docs/backend-specs/00 | Already implemented; B2 follows the same patterns |
| No console logs, env variables, meaningful commits | 01-foundation, CLAUDE.md | Covered |
| Final submission | see the checklist below | Manual |

## Submission checklist

- [ ] Live frontend URL works; demo login and a test payment work in production.
- [ ] GitHub links for the frontend and the backend repositories.
- [ ] The frontend README lists demo credentials: user (tenant), admin, and also owner and manager. Use dedicated demo accounts.
- [ ] Backend and frontend `FRONTEND_URL` and `BACKEND_API_URL` point at each other in production; the JWT secrets match.
- [ ] 20 or more meaningful commits in the frontend.
- [ ] Video walkthrough of 5 to 10 minutes.

## Suggested build order

Follow the 5-day plan; the order below also respects dependencies.

| Step | Spec | Why here |
|---|---|---|
| 1 | 01-foundation and 18-design-system | Everything depends on them (shell, tokens, theme, shared components). Also apply the backend payment-redirect change (B1, spec 10) in the backend repo. |
| 2 | 02-auth | Login, demo buttons, Google, `proxy.ts`. Run the cookie and upload smoke tests from spec 01. |
| 3 | 17-manager-role (permission map only) | `src/lib/permissions.ts` must exist before owner pages are built. |
| 4 | 03-public-rooms | Home, Rooms and Room detail with real data: the first thing to show and review. |
| 5 | 04-profile | Verification status gates properties and payments. |
| 6 | 16-admin, 14-tenant-overview, 15-owner-overview | Overviews and charts (Recharts), URL-synced tables; admin verification unlocks the demo flows. |
| 7 | 12-notifications | The bell lives in every shell. |
| 8 | 05-properties, 06-rooms | Wizard, uploads, first optimistic update. |
| 9 | 07-viewings, 08-applications | Tenant to owner flow. |
| 10 | 10-invoices-payments, 09-leases | Payments and return pages; test every enabled gateway in test mode. |
| 11 | backend change B2, then 19-static-pages | The contact form needs the new endpoint; the other four pages need no backend. |
| 12 | 11-maintenance, then 13-roommates (P1) | Maintenance needs an active lease; roommates only if time remains. |
| 13 | Polish | `rubric-check`, deploy, README with demo credentials, video. |

## Check before or while building

- **Backend snapshot vs specs.** The code snapshot used to extract the Zod schemas stops at migration `20260905120000`. The backend specs are the authority. When `/create-spec` or `/build-feature` meets a doubt, compare with `docs/backend-specs/` and, if needed, ask for the latest backend `*.route.ts` and `*.validation.ts`.
- **Payment redirect change (B1)** in spec 10 must be applied and hand-tested for bKash, SSLCommerz and Stripe before payment screens count as done.
- **Contact endpoint (B2):** `POST /contact` must be built in the backend before the contact form in spec 19 can work.
- **`data.paymentUrl` shape.** Confirm on the first real call that it is a plain URL string (spec 08).
- **Cookie forwarding through the rewrite** and **8 MB uploads through the rewrite on the deployed host** (spec 01 smoke tests).
- **JWT secrets** in the frontend env must equal the backend's, in every environment.
- **Demo accounts.** Copy the demo passwords from the backend `.env` into the frontend server env; put the demo emails in the `NEXT_PUBLIC_DEMO_*_EMAIL` variables. Login applies the full password rules, so they must satisfy them.
- **Google login:** the owner creates a Google OAuth client (Google Cloud console), adds the local and deployed origins, and sets the same client id in the backend and in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- **Owner inputs for the public site:** the final app name, real contact email, phone, address, and real social profile URLs (`src/lib/constants.ts`). Never invent them.
- **Public room `sortBy` values.** `monthlyRent` and `createdAt` are used; other columns are untested.
- **Libraries (approved):** `next-themes`, `@react-oauth/google`. Ask first for `date-fns` or anything else.

## Endpoint map

| Method | Path | Frontend spec | Called from UI |
|---|---|---|---|
| GET | `/api/v1/auth/me` | 02-auth | yes |
| POST | `/api/v1/auth/forgot-password` | 02-auth | yes |
| POST | `/api/v1/auth/google` | 02-auth | yes |
| POST | `/api/v1/auth/login` | 02-auth | yes |
| POST | `/api/v1/auth/logout` | 02-auth | yes |
| POST | `/api/v1/auth/refresh-token` | 02-auth | yes |
| POST | `/api/v1/auth/register` | 02-auth | yes |
| POST | `/api/v1/auth/reset-password` | 02-auth | yes |
| POST | `/api/v1/auth/verify-email` | 02-auth | yes |
| GET | `/api/v1/property/:propertyId` | 03-public-rooms | yes |
| GET | `/api/v1/property/public` | 03-public-rooms | yes |
| GET | `/api/v1/room/:roomId` | 03-public-rooms | yes |
| GET | `/api/v1/room/public` | 03-public-rooms | yes |
| DELETE | `/api/v1/owner/verification-documents` | 04-profile | yes |
| GET | `/api/v1/owner/me` | 04-profile | yes |
| GET | `/api/v1/tenant/me` | 04-profile | yes |
| PATCH | `/api/v1/owner/update-me` | 04-profile | yes |
| PATCH | `/api/v1/tenant/update-me` | 04-profile | yes |
| PATCH | `/api/v1/tenant/verification-document` | 04-profile | yes |
| PATCH | `/api/v1/user/profile-image` | 04-profile | yes |
| PATCH | `/api/v1/user/update-me` | 04-profile | yes |
| POST | `/api/v1/owner/request-verification` | 04-profile | yes |
| POST | `/api/v1/owner/verification-documents` | 04-profile | yes |
| DELETE | `/api/v1/property/:propertyId` | 05-properties | yes |
| DELETE | `/api/v1/property/:propertyId/images` | 05-properties | yes |
| DELETE | `/api/v1/property/:propertyId/managers/:managerId` | 05-properties | yes |
| DELETE | `/api/v1/property/unit/:unitId` | 05-properties | yes |
| GET | `/api/v1/property/:propertyId/managers` | 05-properties | yes |
| GET | `/api/v1/property/my-properties` | 05-properties | yes |
| PATCH | `/api/v1/property/:propertyId` | 05-properties | yes |
| PATCH | `/api/v1/property/unit/:unitId` | 05-properties | yes |
| POST | `/api/v1/property` | 05-properties | yes |
| POST | `/api/v1/property/:propertyId/images` | 05-properties | yes |
| POST | `/api/v1/property/:propertyId/managers` | 05-properties | yes |
| POST | `/api/v1/property/:propertyId/units` | 05-properties | yes |
| DELETE | `/api/v1/room/:roomId` | 06-rooms | yes |
| DELETE | `/api/v1/room/:roomId/images` | 06-rooms | yes |
| GET | `/api/v1/room/availability/:propertyId` | 06-rooms | yes |
| GET | `/api/v1/room/my-rooms` | 06-rooms | yes |
| PATCH | `/api/v1/room/:roomId` | 06-rooms | yes |
| PATCH | `/api/v1/room/:roomId/availability` | 06-rooms | yes |
| POST | `/api/v1/room` | 06-rooms | yes |
| POST | `/api/v1/room/:roomId/images` | 06-rooms | yes |
| GET | `/api/v1/viewing/my-requests` | 07-viewings | yes |
| GET | `/api/v1/viewing/owner-requests` | 07-viewings | yes |
| PATCH | `/api/v1/viewing/:requestId/status` | 07-viewings | yes |
| POST | `/api/v1/viewing` | 07-viewings | yes |
| POST | `/api/v1/viewing/:requestId/cancel` | 07-viewings | yes |
| GET | `/api/v1/application/:applicationId` | 08-applications | yes |
| GET | `/api/v1/application/my-applications` | 08-applications | yes |
| GET | `/api/v1/application/owner-applications` | 08-applications | yes |
| PATCH | `/api/v1/application/:applicationId/review` | 08-applications | yes |
| POST | `/api/v1/application/:applicationId/cancel` | 08-applications | yes |
| POST | `/api/v1/application/:applicationId/pay-deposit` | 08-applications | yes |
| POST | `/api/v1/application/apply` | 08-applications | yes |
| DELETE | `/api/v1/lease/:leaseId/documents/:documentId` | 09-leases | yes |
| GET | `/api/v1/lease/:leaseId` | 09-leases | yes |
| GET | `/api/v1/lease/my-leases` | 09-leases | yes |
| GET | `/api/v1/lease/owner-leases` | 09-leases | yes |
| POST | `/api/v1/lease/:leaseId/documents` | 09-leases | yes |
| POST | `/api/v1/lease/:leaseId/terminate` | 09-leases | yes |
| GET | `/api/v1/invoice/my-invoices` | 10-invoices-payments | yes |
| GET | `/api/v1/invoice/room/:roomId` | 10-invoices-payments | yes |
| GET | `/api/v1/payment/:paymentId` | 10-invoices-payments | yes |
| GET | `/api/v1/payment/callback` | 10-invoices-payments | no |
| GET | `/api/v1/payment/gateways` | 10-invoices-payments | yes |
| GET | `/api/v1/payment/my-payments` | 10-invoices-payments | yes |
| POST | `/api/v1/invoice/:invoiceId/pay` | 10-invoices-payments | yes |
| POST | `/api/v1/invoice/utility-bill` | 10-invoices-payments | yes |
| POST | `/api/v1/payment/confirm` | 10-invoices-payments | no |
| POST | `/api/v1/payment/ipn` | 10-invoices-payments | no |
| POST | `/api/v1/payment/webhook/stripe` | 10-invoices-payments | no |
| GET | `/api/v1/maintenance/my-requests` | 11-maintenance | yes |
| GET | `/api/v1/maintenance/owner-requests` | 11-maintenance | yes |
| PATCH | `/api/v1/maintenance/:requestId/status` | 11-maintenance | yes |
| POST | `/api/v1/maintenance` | 11-maintenance | yes |
| POST | `/api/v1/maintenance/:requestId/image` | 11-maintenance | yes |
| GET | `/api/v1/notification/my-notifications` | 12-notifications | yes |
| GET | `/api/v1/notification/unread-count` | 12-notifications | yes |
| PATCH | `/api/v1/notification/:notificationId/read` | 12-notifications | yes |
| PATCH | `/api/v1/notification/read-all` | 12-notifications | yes |
| DELETE | `/api/v1/roommate/pair/:pairId` | 13-roommates | yes |
| GET | `/api/v1/roommate/match` | 13-roommates | yes |
| GET | `/api/v1/roommate/memberships/:membershipId/utility-bills` | 13-roommates | yes |
| GET | `/api/v1/roommate/memberships/my` | 13-roommates | yes |
| GET | `/api/v1/roommate/my-pairs` | 13-roommates | yes |
| GET | `/api/v1/roommate/my-requests` | 13-roommates | yes |
| PATCH | `/api/v1/roommate/memberships/:membershipId/respond` | 13-roommates | yes |
| PATCH | `/api/v1/roommate/request/:requestId/respond` | 13-roommates | yes |
| POST | `/api/v1/roommate/memberships/:membershipId/leave` | 13-roommates | yes |
| POST | `/api/v1/roommate/memberships/:membershipId/remove` | 13-roommates | yes |
| POST | `/api/v1/roommate/memberships/invite` | 13-roommates | yes |
| POST | `/api/v1/roommate/request` | 13-roommates | yes |
| GET | `/api/v1/analytics/tenant-analytics` | 14-tenant-overview | yes |
| GET | `/api/v1/analytics/manager-analytics` | 15-owner-overview | yes |
| GET | `/api/v1/analytics/owner-analytics` | 15-owner-overview | yes |
| GET | `/api/v1/admin/audit-logs` | 16-admin | yes |
| GET | `/api/v1/admin/dashboard-stats` | 16-admin | yes |
| GET | `/api/v1/admin/payments/pending-refunds` | 16-admin | yes |
| GET | `/api/v1/admin/payments/pending-settlements` | 16-admin | yes |
| GET | `/api/v1/admin/tenant-verifications` | 16-admin | yes |
| GET | `/api/v1/admin/users` | 16-admin | yes |
| GET | `/api/v1/owner/all-owners` | 16-admin | yes |
| GET | `/api/v1/payment/all-payments` | 16-admin | yes |
| GET | `/api/v1/property/all` | 16-admin | yes |
| PATCH | `/api/v1/admin/tenant-verifications/:tenantProfileId` | 16-admin | yes |
| PATCH | `/api/v1/admin/users/:userId/role` | 16-admin | yes |
| PATCH | `/api/v1/admin/users/:userId/status` | 16-admin | yes |
| PATCH | `/api/v1/owner/verify` | 16-admin | yes |
| POST | `/api/v1/admin/payments/pending-refunds/:paymentId/resolve` | 16-admin | yes |
| POST | `/api/v1/admin/payments/pending-settlements/:paymentId/resolve` | 16-admin | yes |
| GET | `/api/v1/manager/me` | 17-manager-role | yes |
| GET | `/api/v1/manager/my-properties` | 17-manager-role | yes |
| PATCH | `/api/v1/manager/update-me` | 17-manager-role | yes |
| POST | `/api/v1/contact` | 19-static-pages | yes |
