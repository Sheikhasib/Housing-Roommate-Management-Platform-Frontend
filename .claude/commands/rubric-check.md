---
description: Check the project against the mandatory requirements, pass or fail
allowed-tools: Read, Glob, Grep
---

Check the project against the list below. For each item give PASS, FAIL or MANUAL, with file paths as evidence. Use MANUAL for anything that cannot be verified from code. Do not edit files. End with the FAIL items sorted by importance.

1. Server and Client Components are split correctly; layout, page, loading and error files exist where needed.
2. Tailwind and shadcn/ui are used; layouts are mobile-first; no placeholder content; `next/image` is used for images.
3. `proxy.ts` protects `/admin`, `/owner` and `/dashboard` by role, and the UI renders by role.
4. The login page has 3 one-click demo buttons.
5. TanStack Query is used for data, a Zustand store exists, every data page has a `loading.tsx` skeleton, an `error.tsx` and an empty state, and at least 2 optimistic updates exist.
6. Forms use `@tanstack/react-form` with Zod; at least one multi-step wizard exists; file upload shows preview and progress.
7. The payment flow exists with `/payment/success` and `/payment/cancel`, and there are no fake payments.
8. Filters, sort, search and pagination live in the URL.
9. `next/dynamic` is used for heavy client components.
10. There is no `any` type; shared components and custom hooks exist.
11. Public pages have metadata.
12. At least 18 real pages exist.
13. A chart exists on the admin dashboard.
14. MANUAL: 20 or more meaningful commits (run `git rev-list --count HEAD` if this is a git repository), demo credentials documented, live URL works, video recorded.

Update-1 rules (`docs/update-1-requirements.md`):

15. Light and dark mode both work with proper contrast; the theme toggle is in the public navbar and the dashboard top bar.
16. At most three brand colors plus neutrals (red only for errors); all colors come from tokens.
17. The navbar is full-width and sticky, shows at least 4 routes logged out and at least 6 logged in, has a profile dropdown, and works on mobile.
18. The home hero is 60 to 70 percent of the viewport height, has an interactive slider and a call to action, and a visible cue to the next section.
19. Home has at least 8 sections filled with real data or factual copy, with no lorem ipsum or dummy content.
20. The footer has working links, contact information and social links.
21. Cards show image, title, short description, meta info and a View details button; they have the same size and radius, at least 3 per row on desktop, and skeleton cards while loading.
22. The room detail page is public, has multiple images and separate Overview, Key information and Related rooms sections.
23. The rooms page has search, at least 2 filters, sorting and pagination.
24. Login and register pages exist; demo buttons auto-fill and sign in; Continue with Google works.
25. Dashboards: tenant sidebar has at least 4 items and admin at least 6; a profile dropdown in the dashboard top bar; overview cards; charts from live data; data tables with filtering and pagination; an editable profile page.
26. At least 3 additional pages (About, Contact, Help, Privacy, Terms) with real content.
27. These forms each have client validation, server error mapping, a loader, a success state and connected labels: login, register, contact, create and edit room or property, profile update.
28. No `console.*` calls; all configuration comes from environment variables.
29. MANUAL: the README lists demo credentials (user, admin and the other roles), the live URL and both GitHub links.
