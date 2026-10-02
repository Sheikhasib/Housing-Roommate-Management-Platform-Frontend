# 03: Public pages and room browsing

Priority: P0 · Backend specs: 05 (public property), 06 (public rooms) · Depends on: 01-foundation, 18-design-system

## Goal
Anyone can land on a rich home page built from real data, browse published rooms and properties, filter and share the view by URL, open a room or property, and start the viewing or application flow (after login). Static pages (About, Contact, Help, Privacy, Terms) are in 19-static-pages.

## Tech used
Server Components with `serverApi` for all public reads (no token forwarded: the guest view), `generateMetadata` for SEO, filter UI as Client Components using `useUrlState`, a small client `HeroSlider`, `next/image`. Base stack: see 01-foundation; look and layout: see 18-design-system.

## Roles
Guests and every logged-in role can read. Tenant-only calls to action appear only for TENANT. Owner, manager and admin viewers see a "Manage in dashboard" link instead.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/` | Home: hero slider plus 9 data-driven sections | all | Server (slider Client) | P0 |
| `/rooms` | Browse rooms with search, filters, sort, pagination in the URL | all | Server (filters Client) | P0 |
| `/rooms/[roomId]` | Room detail: gallery, overview, key information, amenities, property and owner, related rooms, CTAs | all | Server | P0 |
| `/properties` | Browse properties | all | Server | P1 |
| `/properties/[propertyId]` | Property detail with its rooms and a map link | all | Server | P1 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| GET | `/api/v1/room/public` | Public (optional auth) | — | Room search (Redis cached 60 s) |
| GET | `/api/v1/room/:roomId` | Public (optional auth) | — | Room detail (guest view: published rooms only) |
| GET | `/api/v1/property/public` | Public | — | Property list (only properties with a published room) |
| GET | `/api/v1/property/:propertyId` | Public (optional auth) | — | Property detail (guest view: published rooms only) |

## Zod schemas
None (read-only; filters are query params). Validate filter values from the URL with a small Zod schema in `src/validation/rooms-filter.ts` (numbers for `minRent`, `maxRent`, `page`, `limit`; enum values for `type`, `propertyType`, `availability`) and fall back to defaults on invalid input.

## Data and state
**Rooms query params:** `searchTerm`, `city`, `propertyType`, `type`, `minRent`, `maxRent`, `isFurnished` (send only `true`), `availability` (`available` default, `upcoming`, `all`; unknown falls back to default), `sortBy` (default `monthlyRent`; also `createdAt`), `sortOrder` (default `asc`), `page` (1), `limit` (10).
**Room card fields:** first image, name, `description` (short, 2 lines), property title, city, area, room type, `monthlyRent`, `availableBeds`, `availableNow`, `nextAvailableDate`, `isFurnished`. Rating is not shown (the backend has no reviews).
**Room detail fields:** `bookingDeposit`, `minLeaseMonths`, `sizeSqft`, `amenities` (array), `availableFrom`, `bedCount`, `occupiedBeds`, `availableBeds`, `vacantBeds`, `availableNow`, `nextAvailableDate`, `upcomingReleaseDates`, `property { id, title, type, city, area, images, owner { id, name, companyName, user { imageUrl } } }`.
**Properties query params:** `searchTerm`, `city`, `type`, `sortBy`, `sortOrder`, `page`, `limit`. Items include `rooms` (published, sorted by rent), `_count.rooms`, `latitude`, `longitude`, `amenities`, `images`, owner public shape.
- Money strings are formatted with `formatMoney`. `nextAvailableDate` and `upcomingReleaseDates` are ISO dates (never past dates).
- Pages `/rooms/[roomId]` and `/properties/[propertyId]` fetch the guest view even for logged-in users, so drafts never show here. Owners and managers see drafts in their own dashboard pages.

### Home sections (10, in order; all from real data or factual product copy)
Fetch the data in parallel with `Promise.all`. A data section with no rows still renders with an empty state, so the page keeps its structure.

| # | Section | Source |
|---|---|---|
| 1 | Hero with slider and search (see 18-design-system) | `GET /room/public?limit=5&sortBy=createdAt&sortOrder=desc`, rooms with at least one image; with fewer than 2 slides show one static slide |
| 2 | Statistics strip: rooms listed, rooms available now, properties, cities | `meta.total` of `GET /room/public?limit=1&availability=all` (rooms listed), `GET /room/public?limit=1` (available now), `GET /property/public?limit=1` (properties); cities = distinct `city` values among `GET /property/public?limit=50` |
| 3 | Browse by room type: PRIVATE_ROOM, SHARED_ROOM, ENTIRE_FLAT, BED, each with a count and a link to `/rooms?type=<TYPE>` | `meta.total` of `GET /room/public?type=<TYPE>&limit=1` (4 calls) |
| 4 | Featured rooms: 6 room cards and a "View all rooms" link | `GET /room/public?limit=6&sortBy=createdAt&sortOrder=desc` |
| 5 | Popular cities: up to 6 cities by room count, each with a photo of its first property and a link to `/rooms?city=<city>` | group `GET /property/public?limit=50` by `city`, sum `_count.rooms` |
| 6 | Featured properties: 6 property cards | `GET /property/public?limit=6` |
| 7 | How it works: Browse, Visit, Apply and pay the deposit, Move in | static factual copy |
| 8 | Why choose us: Verified owners and tenants, Secure payments (bKash, SSLCommerz, Stripe), Roommate matching, Maintenance requests | static factual copy that matches real features |
| 9 | FAQ: the first 5 entries of the shared FAQ list, and a link to `/help` | `src/lib/faq.ts` (same source as 19-static-pages) |
| 10 | Call to action band: "List your property" (owners, links to `/register`) and "Find a room" (links to `/rooms`) | static |

## States
Skeleton card grid while loading (same card size), empty state "No rooms match your filters" with a "Clear filters" action, error state with retry. A 404 from detail routes renders `not-found.tsx`.

## UX notes
- Filter bar: search input (debounced), city select or input, property type and room type selects, rent range, furnished switch, availability segmented control (Available now, Available soon, All), sort select. On mobile, filters open in a sheet. Active filters show as removable chips. Every change updates the URL and resets `page` to 1. At least two filters work together (city, room type, rent range and more).
- Cards follow the "one size for every card" rule in 18-design-system: image, title, 2-line description, meta, **View details** button; at least 3 per row on desktop; skeleton cards identical.
- Availability badge on cards: "Available now", "Available from <date>" for upcoming, "Fully occupied" if neither.
- Room detail sections, separated by headings: Overview (description), Key information (room type, size, beds total and free, monthly rent, booking deposit, minimum lease, furnished, available from), Amenities, Property and owner, Location, **Related rooms**. Related rooms come from `GET /room/public?city=<this city>&limit=5`: drop the current room and show up to 4; hide the section when none remain. There is no Reviews section (the backend has no reviews).
- Room detail CTAs: guest sees "Log in to request a viewing" and "Log in to apply" (link to `/login?redirectTo=<current url>`); TENANT opens the viewing dialog (07-viewings) and the apply dialog (08-applications); apply is disabled with "Available from <date>" when `availableNow` is false; owner, manager and admin viewers see "Manage in dashboard".
- Property detail: image gallery, amenities, house rules, an "Open in Google Maps" link from `googleMapUrl` or the coordinates, and a rooms grid.
- Home hero search sends the user to `/rooms?searchTerm=...&city=...&type=...&maxRent=...`.
- Metadata: `generateMetadata` for room and property pages (title, description, Open Graph image from the first image); static metadata for Home and Rooms.

## Backend rules the UI must respect
- Public room search shows only published rooms of non-deleted properties; default availability hides OCCUPIED and MAINTENANCE rooms; `upcoming` shows OCCUPIED rooms that have a computed `nextAvailableDate`.
- Results can be up to 60 seconds stale (cache); do not treat that as a bug.
- Room detail is decorated identically for every viewer; only the owner, assigned manager and admin can see unpublished rooms (not through these pages).
- Property detail for a non-owner returns `units: []` and the trimmed owner shape; any other authenticated actor gets 403 on the full view (not relevant to the guest view used here).

## Acceptance checklist
- [ ] Home shows the hero (60 to 70 percent of the viewport, working slider with real photos, search, Explore cue) and 9 more sections, all filled from the API or factual copy, with no placeholder text.
- [ ] Statistics numbers equal the API totals; room type counts equal the API totals.
- [ ] `/rooms` search, at least two filters, sort and pagination all live in the URL and survive a reload and a shared link.
- [ ] `availability=upcoming` lists rooms with a next available date; `all` includes full rooms.
- [ ] Every card has an image, title, short description, meta info and a View details button; all cards have the same size; 3 per row from 1024 px; skeleton cards match.
- [ ] Room detail shows a gallery, correct bed counts, separate Overview and Key information sections, and Related rooms.
- [ ] Guest CTAs send the user to login and return to the same room afterwards.
- [ ] Tenant CTAs open the viewing and apply dialogs; owner viewers see the dashboard link.
- [ ] Property detail shows rooms and a working map link.
- [ ] Metadata is present on every public page; images use `next/image` with Cloudinary allowed.

## Out of scope
Map embeds and geo search (coordinates are for pin links only), saved searches or favorites, reviews and ratings, testimonials, newsletter and blog sections (no backend data behind them). About, Contact, Help, Privacy and Terms are in 19-static-pages.
