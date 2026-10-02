# 19: Static pages (About, Contact, Help, Privacy, Terms)

Priority: P0 · Backend specs: none; the contact form needs the new backend change B2 (a public contact endpoint) · Depends on: 01-foundation, 18-design-system

## Goal
Five public pages with real, accurate content: About, Contact (with a working form), Help (FAQ), Privacy and Terms. The navbar and footer link to all of them.

## Tech used
Server Components for the content; `@tanstack/react-form` + Zod for the contact form with `apiClient`; shadcn `Accordion` for the FAQ; `src/lib/constants.ts` for the owner's real contact details and social links; `src/lib/faq.ts` as the single FAQ source (also used by Home). Base stack: see 01-foundation; look: see 18-design-system.

## Roles
Guests and every logged-in role.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/about` | About the platform | all | Server | P0 |
| `/contact` | Contact details and message form | all | Server (form Client) | P0 |
| `/help` | Help centre: FAQ accordion and support contact | all | Server (accordion Client) | P0 |
| `/privacy` | Privacy policy | all | Server | P0 |
| `/terms` | Terms of service | all | Server | P0 |

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| POST | `/api/v1/contact` | Public (rate limited) | ContactMessageZodSchema | Stores the message and emails the admin. **New backend change B2: it does not exist yet.** |

## Zod schemas
The frontend schema below is the contract; B2 must implement exactly the same rules and messages (Zod 4).

```ts
export const ContactMessageZodSchema = z.object({
	name: z
		.string("Name is required")
		.trim()
		.min(2, "Name must be at least 2 characters")
		.max(80, "Name must be at most 80 characters"),
	email: z.email("Please enter a valid email address"),
	subject: z
		.string()
		.trim()
		.min(3, "Subject must be at least 3 characters")
		.max(120, "Subject must be at most 120 characters")
		.optional(),
	message: z
		.string("Message is required")
		.trim()
		.min(10, "Message must be at least 10 characters")
		.max(1000, "Message must be at most 1000 characters"),
});
```

## Data and state
- Contact form fields: name, email, subject (optional), message (with a character counter). For a logged-in user prefill name and email from `useGetMe`.
- Submit: `POST /contact` through `apiClient`. Success: reset the form, show an inline success message ("Thanks, we received your message") and a toast. A 400 maps `errors[]` to the fields; a 429 shows the rate-limit message and disables the button for a short time; other failures raise a toast.
- `src/lib/faq.ts` exports `FAQ_ITEMS` (`{ question, answer }`). At least 8 real entries that match the backend rules: how identity verification works for tenants and owners, how viewing requests work, how applications work and that they expire after 14 days without a decision, how the booking deposit is paid and what happens next, which payment gateways exist and that payments are sandbox in test mode, what happens to a deposit when a lease is terminated, how roommate matching works, and how to contact support.
- `src/lib/constants.ts` exports `APP_NAME`, `CONTACT` (email, phone, address, hours) and `SOCIAL_LINKS`. Ask the owner for the real values; never invent them.

## States
Contact form: pending, field errors, success, rate-limited. Other pages are static, so they have no loading state; they still export metadata and render in both themes.

## UX notes
- **About:** what the platform is and who it serves (tenants, owners and managers), how verification and secure payments work, how roommate matching helps, and live platform statistics (the same real numbers as Home). Describe only what exists: no team photos, no testimonials, no invented history.
- **Contact:** two columns on desktop: the form card, and a details card with email, phone, address, hours and social links. Each field has a label connected to its input.
- **Help:** a short intro, the FAQ accordion, and a "Still need help?" card linking to `/contact`.
- **Privacy:** sections with anchors and a table of contents: what we collect (account details, profile, verification documents, payment references; card data never touches this site because gateways process payments), how we use it, who can see it (owners see applicants, admins review documents), cookies (httpOnly session cookies and the theme preference), retention, security, your choices, contact. Add "Last updated" with a real date.
- **Terms:** sections with anchors and a table of contents: acceptance, accounts and verification, listings and applications, deposits and payments (gateways, refunds on lease termination), acceptable use, liability, changes, contact. Add "Last updated" with a real date.
- All five are written in plain language, in English, with real content and no placeholder text. The owner reviews Privacy and Terms before submission.

## Backend rules the UI must respect
- `POST /contact` (B2) is public, rate limited, validates with the schema above and answers 201 on success; errors use the normal envelope (`errors[]` with `field` and `message`).
- B2 stores each message and emails the admin; the frontend never shows other users' messages.

## Acceptance checklist
- [ ] `/about`, `/contact`, `/help`, `/privacy` and `/terms` exist, have real content and are linked from the navbar or footer.
- [ ] The contact form validates on the client and shows server errors per field; it shows a loader while sending and a success state afterwards; labels are connected to inputs.
- [ ] After backend change B2 a submitted message is stored and the admin is emailed.
- [ ] FAQ has at least 8 accurate entries; Home shows the first 5 from the same source.
- [ ] Contact details and social links come from `constants.ts` with the owner's real values; every footer link works.
- [ ] All five pages have metadata, work on mobile and look right in light and dark mode.

## Out of scope
Live chat, ticketing, a blog, a newsletter, an admin inbox page (messages can be read in the database or the admin's email for now).
