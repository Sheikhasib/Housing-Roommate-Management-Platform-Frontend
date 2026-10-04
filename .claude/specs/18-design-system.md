# 18: Design system

Priority: P0 · Backend specs: none · Depends on: 01-foundation · Build together with 01

## Goal
One visual language for every page, so the product looks like a clean, trustworthy, photo-forward housing marketplace (the feel of Airbnb and Zillow) and not like a default template. It works in light and dark mode. This spec holds the tokens, type scale and page patterns that every other spec follows.

## Tech used
Tailwind CSS 4 tokens in `src/app/globals.css` (shadcn variable names), shadcn/ui components, `next-themes` (light, dark, system), `next/font/google` (Plus Jakarta Sans), Lucide icons, Sonner. No new library beyond what shadcn installs and `next-themes`.

## Roles
All roles. One theme for every area; only a small role chip tells the areas apart.

## Pages and routes
None. This spec defines visual rules and page patterns used by the other specs.

## Endpoints
None.

## Zod schemas
None.

## Data and state
None. The tokens in `globals.css` are the single source of truth for color, radius and font. The theme choice (light, dark, system) is kept by `next-themes` (a preference only, never a token or secret).

## States
Patterns for loading, empty, error and success are defined under "UX notes" below and reused everywhere.

## UX notes

### Product feel
- Audience: renters (students, young professionals) looking for a room and a roommate; owners and managers running properties; admins.
- Tone: calm, plain-spoken, reassuring about money and verification. Sentence case for labels and buttons. No emojis in the interface.
- Formats: money through `formatMoney` (BDT with the taka sign), dates like `12 Oct 2026`, times in 12-hour form.
- Trust cues: a **Verified** badge (ShieldCheck icon) on owners and tenants whose status is APPROVED, availability wording ("Available now", "Available from 12 Oct"), the gateway names next to payment actions with a "Sandbox payments, no real money" note while in test mode, and real photos only.
- Content rule: every section shows real data or factual product copy. No testimonials, newsletter boxes, fake blog posts or stock people: there is no data behind them.
- The product name comes from `APP_NAME` in `src/lib/constants.ts`. Ask the owner for the final name; use "Housing Roommate" until then.

### Colors: three brand colors plus neutrals
Exactly three brand colors: **primary teal**, **secondary indigo**, **accent amber**. Everything else is a neutral slate. Red exists only as the system color for errors and destructive actions; it is never a decorative or brand color.

| Role | Light | Dark | Use |
|---|---|---|---|
| Primary (`--primary`) | `#0F766E` | `#2DD4BF` | main buttons, links, active nav, success |
| Secondary (`--brand-secondary`) | `#3730A3` | `#A5B4FC` | secondary actions, info, second chart series |
| Accent (`--brand-accent`) | `#B45309` | `#FBBF24` | highlights, ratings, warnings, third chart series |

### Tokens (single source: `src/app/globals.css`)
Define the light values under `:root` and the dark values under `.dark`, using the shadcn variable names. Use hex; Tailwind 4 accepts it. Enable the dark variant with `@custom-variant dark (&:is(.dark *));`.

| Variable | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#F8FAFC` | `#0B1220` | page background |
| `--foreground` | `#0F172A` | `#E2E8F0` | body text |
| `--card`, `--popover` | `#FFFFFF` | `#111B2E` | cards, menus |
| `--primary-foreground` | `#FFFFFF` | `#042F2E` | text on primary |
| `--accent` | `#F0FDFA` | `#0F2A2A` | tint behind active items and hovers |
| `--accent-foreground` | `#0F766E` | `#5EEAD4` | text on accent |
| `--secondary`, `--muted` | `#F1F5F9` | `#1A2740` | quiet surfaces, skeletons |
| `--muted-foreground` | `#475569` | `#94A3B8` | secondary text |
| `--border` | `#E2E8F0` | `#1E293B` | card and divider lines |
| `--input` | `#7C8BA1` | `#64748B` | input and select borders |
| `--ring` | `#0F766E` | `#2DD4BF` | focus ring |
| `--destructive` | `#B91C1C` | `#DC2626` | destructive buttons (white text) |
| `--error-text` | `#B91C1C` | `#F87171` | error messages |
| `--chart-1` to `--chart-4` | `#0F766E`, `#3730A3`, `#B45309`, `#64748B` | `#2DD4BF`, `#A5B4FC`, `#FBBF24`, `#94A3B8` | charts |
| `--radius` | `0.75rem` | same | base radius |

Status tokens used by `StatusBadge` (text on tint), mapped onto the palette so no extra hue appears:

| Status | Light | Dark |
|---|---|---|
| success (teal) | `#0F766E` on `#F0FDFA` | `#5EEAD4` on `#0F2E2B` |
| warning (amber) | `#92400E` on `#FFFBEB` | `#FCD34D` on `#2A1F08` |
| info (indigo) | `#3730A3` on `#EEF2FF` | `#A5B4FC` on `#1B1F4A` |
| danger (red) | `#991B1B` on `#FEF2F2` | `#FCA5A5` on `#3A1212` |
| neutral (slate) | `#334155` on `#F1F5F9` | `#CBD5E1` on `#1E293B` |

Primary hover: `#115E59` (light), `#5EEAD4` (dark).

Measured WCAG contrast. Light: body text on white 17.85:1, muted text 7.58:1, white on primary 5.47:1, white on indigo 9.93:1, amber text on white 5.02:1, error text 6.47:1, every status pair at least 5.25:1, input border 3.46:1. Dark: body text on page 15.19:1, muted text on card 6.71:1, primary text 9.25:1, dark text on primary 7.77:1, every status pair at least 7.85:1, input border on card 3.62:1, chart colors at least 6.71:1. Text needs 4.5:1 and input borders and chart marks need 3:1: do not lighten or darken these values.

### Light and dark mode
- `ThemeProvider` from `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`; put `suppressHydrationWarning` on `<html>`.
- `ThemeToggle` (Sun and Moon icons) opens a dropdown with Light, Dark and System. It sits in the public navbar and in the dashboard top bar.
- Components use tokens only (`bg-background`, `text-foreground`, `border-border`). Never write a raw color, and use `dark:` only for non-color tweaks.
- Check every page, dialog, table, chart and skeleton in both themes. Images keep their look; add no overlay filter.

### Typography
- Plus Jakarta Sans, weights 400, 500, 600, 700, loaded with `next/font/google` (`display: "swap"`). Replace the font the scaffold sets up. One family only.
- Page title `text-2xl font-semibold`; section title `text-lg font-semibold`; card title `text-base font-semibold`; body `text-sm` (dashboards) or `text-base` (public pages); helper text `text-xs`. Never below 12 px. Prose line length at most 70 characters.

### Shape, space and depth
- Radius: cards and images `rounded-xl`; buttons and inputs `rounded-lg`; badges and chips `rounded-full`.
- Depth: `shadow-sm` at rest, `shadow-md` on hover for clickable cards; 1 px `--border` lines. No gradients, glass effects or heavy shadows.
- Spacing on a 4 px grid. Public container `max-w-7xl` with `px-4 sm:px-6 lg:px-8`; dashboard content `max-w-6xl`. Section spacing `py-12 md:py-16` on public pages, `space-y-6` in dashboards.
- Motion: 150 to 200 ms transitions on hover and focus; the hero slider fades or slides; skeleton pulse is allowed. Respect `prefers-reduced-motion`. No animation library.

### One size for every card
All cards of the same kind share one size, radius, border, padding and layout.
- Card is `h-full flex flex-col`; the grid uses `items-stretch`; image ratio is fixed (4:3).
- Title is clamped to 1 line, short description to 2 lines (`line-clamp`), so heights never differ.
- The meta row and the **View details** button sit at the bottom (`mt-auto`).
- Skeleton cards have the exact same size.
- Desktop grids show at least 3 cards per row.

### Shells
- **Public navbar:** full-width bar (the background spans the whole width; content sits in `max-w-7xl`), `sticky top-0 z-50`, 64 px, bottom border, solid background (no glass). Logged out: Home, Rooms, About, Contact, then **Log in** (ghost) and **Sign up** (primary) at least 4 routes. Logged in: Home, Rooms, About, Contact, Help, Dashboard (at least 6 routes), then `ThemeToggle`, the notification bell and a **profile dropdown** (avatar and name; Profile, Notifications, Dashboard, Log out). Mobile: a hamburger opens a sheet with the same routes and the same actions.
- **Footer:** four columns: brand with a short sentence and social icons; Explore (Home, Rooms); Support (Help, Contact, Privacy, Terms); Contact (address, email, phone). A bottom bar with the copyright and year. Contact details and social URLs come from `src/lib/constants.ts` (real values from the owner). Every link goes to a real route or a real URL; external links open in a new tab with `rel="noopener noreferrer"`.
- **Dashboard:** left sidebar 264 px (72 px icon-only when collapsed), white with a right border. Top: wordmark and a neutral role chip (Admin, Owner, Manager, Tenant). Nav items: Lucide icon plus label; the active item has the accent tint, primary text and a 3 px primary bar on the left. Top bar 64 px: page title on the left; `ThemeToggle`, notification bell and a **profile dropdown** on the right (avatar, name and role; Profile, Notifications, Back to website, Log out). Content area on `--background` with cards. Mobile: the sidebar becomes a sheet opened from a hamburger.
- **Auth:** centered card (max 440 px) on `--background`; on large screens a split layout with a real room photo panel on the left.
- **Page header pattern** (every dashboard page): title, one-line description, primary action on the right; filters below in a single row.

### Page patterns
**Home** (sections and data are in 03-public-rooms)
- Hero: height between 60 and 70 percent of the viewport (`h-[60vh] md:h-[65vh]` with `max-h-[70vh]`, never taller). The photo is the star: a slider of featured rooms fills the whole background (real photo, room name, city and rent per slide; auto-advance every 6 seconds, pause on hover and focus, previous and next buttons, dots, swipe on touch, no auto-advance under reduced motion), and the photo stays visible across at least 60 percent of the width at 1280 px. Top-left: a compact headline card (`max-w-md`, `text-3xl md:text-4xl`, one-line promise, no search inside) on a solid `bg-card`. Bottom-right: the slide caption with previous and next buttons and dots. Bottom: ONE wide, short search bar (search text, city, room type, max rent, Search in one row from `lg` up) in `bg-card rounded-xl shadow-md`, docked to the bottom of the hero and overlapping its lower edge by half. Below `lg` it shows the search text and Search, with a "More filters" disclosure for city, room type and max rent: a solid `bg-card` panel over the next section that closes on outside click and on Escape. A bouncing chevron "Explore" link (no bounce under reduced motion) sits just above the bar and scrolls to the next section.
- Sections alternate between `--background` and `--card` backgrounds so the page has a clear rhythm; each has a title, a one-line description and, where useful, a "View all" link.

**Room type card** (Home, "Browse by room type")
- Photo-led: the first photo of the first room of that type (from the data the page already fetches, no extra calls) at 16:10 with `rounded-xl` on top; then the title, a one-line description and the "N available now" row. When the type has no photo, the same 16:10 box shows the type icon on `bg-accent`. All four cards are the same size.

**Room card** (Home, Rooms, Property pages)
- Image 4:3 with `rounded-xl` and `object-cover`; top-left availability badge ("Available now" success, "Available from 12 Oct" info, "Fully occupied" neutral).
- Body: title (1 line), "Property title, City" in muted text, short description (2 lines), small chips (room type, Furnished), price row with the rent in semibold and "/ month" muted, "2 of 4 beds free" in muted text.
- Footer: a full-width outline **View details** button. The whole card also links to the room; hover lifts with `shadow-md`; visible focus ring.

**Rooms browse**
- Sticky filter bar under the navbar: search input, then selects and chips for city, room type, rent range, furnished and availability; sort select at the right. Active filters show as removable chips under the bar. On mobile the filters open in a sheet and a "Filters (n)" button replaces the bar.
- Grid: 1 column on mobile, 2 at `sm`, 3 at `lg`, 4 at `xl`. Result count above the grid, pagination below.

**Room detail**
- Gallery: one large image and a 2x2 grid of smaller ones on desktop with a "View all photos" dialog; a horizontal scroll-snap carousel on mobile.
- Two columns on desktop. Left, separated by headings: Overview, Key information (a two-column table), Amenities (icon grid), Property and owner (Verified badge), Location (text and a map link), Related rooms (a row of room cards). Right: a sticky booking card (rent, deposit, minimum lease, bed availability, next available date, primary "Apply" and secondary "Request a viewing"). On mobile the booking card becomes a sticky bottom bar with the rent and the primary action.

**Auth pages**
- Login: heading, "Continue with Google" button, "OR" divider, email and password, primary Log in button, "OR" divider, then "Quick demo login" as 3 equal cards (Admin, Owner, Tenant) each with a role icon, a one-line description and a **Demo Login** button that fills the form and signs in; a collapsed "More demo accounts" below.
- Register: stepper in two steps; role selection as three large selectable cards; "Continue with Google" above the form.

**Static pages** (About, Help, Privacy, Terms, Contact)
- A header band with title and one sentence, then prose in `max-w-3xl` with `text-base` and generous spacing. Privacy and Terms add a sticky table of contents on large screens. Help uses an accordion. Contact is two columns: the form card and a contact details card.

**Overview dashboards** (tenant, owner, admin)
- Row of 4 `StatCard` (icon in a tinted circle, label, large number, hint), then charts in a two-column grid, then "Next actions" or "Pending queues" as cards with a count and a link.

**List pages** (applications, leases, invoices, users and so on)
- Page header, filter row (search, status select), then a card with the `DataTable`: muted `text-xs` uppercase header, row hover tint, status through `StatusBadge`, row actions in a dropdown, pagination in the card footer. Every table has filtering and pagination. On mobile each row becomes a stacked card.

**Detail pages**
- Header with title, `StatusBadge` and actions. Two columns on desktop: facts and timeline on the left, related cards (payment, documents, people) on the right. Timelines use numbered or checked steps with the current step in primary.

**Forms and wizards**
- Single column, label above the field (`<Label htmlFor>` matching the input `id`), helper text below, errors in `--error-text` with an icon under the field, linked with `aria-describedby` and announced with `role="alert"`. Buttons right-aligned; destructive actions separated.
- Every form shows four states: validation errors, server errors mapped to fields, a loading state (spinner inside the button and the button disabled), and a success state (a toast plus an inline success message, or a redirect).
- Wizard: stepper with numbered circles and a connecting line (current in primary, done with a check), Back and Next in a footer; on mobile the footer is sticky. Upload zones show a dashed `--border`, preview thumbnails and a progress bar.

**Dialogs and confirmations**
- shadcn `Dialog` for forms, `AlertDialog` for destructive confirmations; the destructive button uses `--destructive`; say exactly what will happen.

**Loading, empty, error**
- Skeletons mirror the final layout (card skeletons for grids, row skeletons for tables, stat card skeletons).
- Empty state: Lucide icon in a tinted circle, a short title, one sentence of help, one primary action.
- Error state: icon, plain explanation, "Try again" button; the toast shows the backend message.

**Charts (Recharts)**
- Series colors come from `--chart-1` to `--chart-4` only (teal, indigo, amber, slate; lighter variants in dark mode). Rounded bars (radius 6), light grid, a legend below, tooltips on `--card`. Each chart has a title, a text summary for screen readers and an empty state, and is fed by live API data.

**Payment return pages**
- Centered card (max 480 px): a large status icon in a tinted circle (CheckCircle2 success, Clock info, XCircle neutral), a headline, a summary list (amount, gateway, transaction id, date), and a primary and a secondary button. No confetti.

**Notifications**
- Bell with a count badge (`99+` cap); dropdown of 5 items with an icon per type, bold title for unread, relative time; the page repeats the pattern in a list.

### shadcn components to add
`button input label textarea select checkbox switch radio-group badge card dialog alert-dialog sheet dropdown-menu tabs table skeleton separator avatar tooltip popover progress breadcrumb accordion alert sonner` (and `chart` if Recharts styling needs it). Do **not** add shadcn `form` (the project uses TanStack Form) or `calendar` (it needs `date-fns`): use styled native `type="date"` inputs.

## Backend rules the UI must respect
None for visuals. Status wording and color mapping follow 01-foundation.

## Acceptance checklist
- [ ] `globals.css` defines every token for light and dark; no hard-coded hex or raw palette colors exist in components (search for `#`, `bg-slate`, `text-gray` and similar).
- [ ] Only the three brand colors plus neutrals appear; red appears only on errors and destructive actions.
- [ ] The theme toggle (Light, Dark, System) works in the public navbar and the dashboard top bar, survives a reload, and every page is readable in both themes.
- [ ] Plus Jakarta Sans loads through `next/font/google`; the scaffold's default font is gone.
- [ ] `DataTable`, `StatCard`, `StatusBadge`, `SearchInput`, `EmptyState`, `Pagination`, `FileUploader` and `ThemeToggle` exist and every list page uses them.
- [ ] All room cards have identical size and layout (1-line title, 2-line description, View details button at the bottom); at least 3 per row at 1024 px and wider; skeleton cards match.
- [ ] The navbar is full-width and sticky, shows at least 4 routes logged out and at least 6 logged in, has a profile dropdown, and works on mobile.
- [ ] The hero is between 60 and 70 percent of the viewport height, its slider works with real photos, and the Explore cue scrolls to the next section.
- [ ] The footer has contact details, social links and only working links.
- [ ] Home, Rooms and Room detail follow the patterns at 360, 768 and 1280 px with no horizontal scroll.
- [ ] The dashboard shell works: collapsible sidebar, mobile sheet, clear active item, role chip, profile dropdown.
- [ ] A keyboard-only user can use the nav, filters, dialogs and forms; the focus ring is always visible.
- [ ] Text contrast is at least 4.5:1 and input borders at least 3:1 in both themes, using the token values above.
- [ ] Every form shows validation errors, a loader, a success state, and has labels connected to inputs.
- [ ] Skeletons match their final layouts; every empty state has an icon, a title and an action.
- [ ] No gradients, glass effects or heavy shadows; transitions are 150 to 200 ms and `prefers-reduced-motion` is respected.

## Out of scope
Custom illustrations, brand logo design, multi-language interface, testimonials, newsletter and blog sections (no backend data).
