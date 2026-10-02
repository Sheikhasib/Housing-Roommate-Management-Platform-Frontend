# Housing & Roommate Management Platform: Frontend

## What this is
This repo is the **frontend only**; the backend is a separate repo. Never invent
endpoints, fields, roles or error messages. Backend behavior comes from
`docs/backend-specs/*.md` (read-only reference). If something is not covered
there or in a frontend spec, ask me for the backend route or validation file.

## Where things are
- Frontend specs: `.claude/specs/NN-*.md`. Shared conventions for every feature
  (clients, errors, uploads, shells, env) are in `.claude/specs/01-foundation.md`:
  read it before any feature.
- Visual rules: `.claude/rules/ui.md` (always loaded) and `.claude/specs/18-design-system.md`
  (tokens, type scale, page patterns): read it before any UI work.
- Each spec marks pages P0 or P1. Build P0 first; ask before building P1.
- `docs/frontend-spec-coverage.md` maps backend specs, endpoints and pages to
  frontend specs.
- `docs/backend-specs/`, `docs/update-1-requirements.md`, the `*.zip` files and
  `project-requirements.md` are reference only: never edit them. The two
  requirements files are the course rules the app is graded on.

## Next.js warning
This is Next.js 16 with React 19. It differs from older versions. Before writing
routing, `proxy.ts`, caching or Server Action code, read the matching guide in
`node_modules/next/dist/docs/`. Use `proxy.ts` (not `middleware.ts`). Zod is v4.

## Stack (fixed, do not add alternatives)
Next.js App Router, TypeScript strict (no `any`), Tailwind CSS 4 + shadcn/ui,
TanStack Query, Zustand, `@tanstack/react-form` + Zod, `ofetch`, Lucide icons,
Sonner toasts, Recharts, `next-themes`, `@react-oauth/google`. Light and dark mode
are both required. Package manager: **npm only** (never bun, pnpm, yarn).
Server Components by default; add `"use client"` only for state, effects or
event handlers.

## Roles and routes
Backend roles: SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT.
The app has **3 primary areas**:
- Admin: `/admin` (SUPER_ADMIN uses it too, plus role management)
- Owner: `/owner` (PROPERTY_MANAGER uses it too, with money actions hidden)
- Tenant: `/dashboard`

Payment return pages: `/payment/success` and `/payment/cancel`.

## Auth rules
- Login, register, logout and demo login are Server Actions. Tokens are saved as
  httpOnly cookies `accessToken` / `refreshToken` on the frontend domain.
- `proxy.ts` protects routes by role (verifies the JWT, refreshes silently).
- Browser API calls go to `/api/v1/...` (rewritten to the backend). Server calls
  use `BACKEND_API_URL`. Use the `ofetch` clients in `src/lib/api/` only; no raw
  `fetch` to the backend.
- Never store tokens in localStorage. Never log tokens or API responses. Never
  hard-code credentials. Demo credentials come from server env vars.
- The UI hides things by role, but the backend is the real authority.

## Payments
Gateway buttons come from `GET /payment/gateways`. No hard-coded gateway and no
fake or cash payment. The success page must re-fetch the payment status and
never assume it is paid.

## Backend facts
- Response envelope: `{ success, statusCode, message, data, meta? }`.
- The backend reads the token from cookie `accessToken` or `Authorization: Bearer`.

## Definition of done
- Every data page has a `loading.tsx` skeleton, an empty state, `error.tsx`,
  and a toast on API errors.
- Filters, sort, search and pagination live in the URL (`useSearchParams`).
- Use `next/image`. No placeholder or Lorem content. No mock data in core flows.
- Forms use `@tanstack/react-form` + Zod with plain-language error messages, a
  loader, a success state and labels connected to inputs.
- No `console.*` calls in committed code.
- Before saying a task is done, run `npm run typecheck`, `npm run lint` and
  `npm run build`. Fix every error. Never claim success if any of them fails.

## How to work
- One feature at a time. First show a short plan and the files you will change,
  then wait for approval.
- Make small changes. Do not edit files outside the task.
- Do not install a new library without asking.
- If this file and the request disagree, ask before continuing.
- Commit messages: `feat: ...`, `fix: ...`, `refactor: ...`.
