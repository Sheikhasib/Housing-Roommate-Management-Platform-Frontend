# Neer: Housing & Roommate Management Platform

> **Ashroy for your next home.**

Neer is a full-stack web platform where tenants find and rent rooms, owners and property managers run their properties, and admins keep the marketplace trustworthy. It covers the whole rental journey: browsing rooms, booking a viewing, applying, signing a lease, paying deposits and rent online, and raising maintenance requests.

|                     | Link                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| Live app            | https://housing-roommate-management-platform-frontend.vercel.app            |
| Backend API         | https://housing-roommate-management-platform-backend.vercel.app             |
| Frontend repository | https://github.com/Sheikhasib/Housing-Roommate-Management-Platform-Frontend |
| Backend repository  | https://github.com/Sheikhasib/Housing-Roommate-Management-Platform-Backend  |
| Demo video          | _add link here_                                                             |

> The backend runs on free-tier serverless hosting, so the very first request after a quiet period can take a few seconds.

---

## Try it in one minute

Open the live app, go to **Log in**, and use the **Quick demo login** buttons to enter as any role without typing anything. Or log in manually:

| Role             | Email                 | Password       |
| ---------------- | --------------------- | -------------- |
| Admin            | `admin@housing.com`   | `Admin@1234`   |
| Owner            | `owner@housing.com`   | `Owner@1234`   |
| Property manager | `manager@housing.com` | `Manager@1234` |
| Tenant           | `tenant@housing.com`  | `Tenant@1234`  |

**Payments are in sandbox mode, no real money moves.** To pay with Stripe use the test card `4242 4242 4242 4242`, any future expiry date and any CVC.

---

## What you can do, by role

**Everyone (no account needed)**

- Browse rooms with filters and pagination, open a room to see its gallery, price and details
- Browse properties, and open one to see its images, amenities, map link and its published rooms
- Home page with live platform numbers, room types and featured rooms
- About, Contact, Help (FAQ), Privacy and Terms pages
- Light and dark theme

**Tenant**

- Overview with stats, charts and a "next actions" list
- Request a viewing (and cancel it), apply for a room (and cancel the application)
- See leases, open a lease, terminate it
- Pay the deposit, pay invoices, see payment history and payment details
- Find roommates: ranked matches, send and answer requests, pairs, invite a roommate to your room and see the room's utility bills with a suggested equal split
- Raise maintenance requests with photos and follow their status
- Notifications, profile and identity verification

**Owner and property manager** (managers use the owner area for the properties they manage)

- Overview with role-aware stats and charts
- Create properties with a step-by-step wizard, add images, units and managers
- Create rooms, set availability, upload images
- Approve or reject applications, approve, reject or complete viewings
- Leases, invoices and utility bills, maintenance requests with a status workflow and photos

**Admin**

- Overview with stats, charts and pending queues
- Users, identity verifications, properties
- Payments: all payments, pending refunds, and pending settlements that need a manual decision
- Audit logs

**Platform**

- Email and password login, email verification, forgot and reset password, Google sign-in
- Payments with bKash, SSLCommerz and Stripe (sandbox)
- In-app notifications with an unread badge

---

## Tech stack

**Frontend (this repository)**

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 and shadcn/ui (Radix), Lucide icons, Sonner toasts
- TanStack Query (data fetching), Zustand (state), Zod (validation)
- Recharts (charts), next-themes (light and dark theme)
- `@react-oauth/google` (Google sign-in), `jose` (token checks)

**Backend (separate repository)**

- Node.js, Express, TypeScript
- Prisma with PostgreSQL, Redis
- Cloudinary for images, SMTP for email
- Stripe, bKash and SSLCommerz payment gateways
- Deployed on Vercel (serverless)

---

## Run it locally

You need Node.js 20 or newer and the backend running (see the backend repository for its setup).

```bash
git clone https://github.com/Sheikhasib/Housing-Roommate-Management-Platform-Frontend.git
cd Housing-Roommate-Management-Platform-Frontend
npm install
```

Create a `.env.local` file in the project root:

| Variable                                    | What it is                                                                                         |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `BACKEND_API_URL`                           | Base address of the backend, for example `http://localhost:5000` (no trailing slash, no `/api/v1`) |
| `JWT_ACCESS_SECRET`                         | Must be exactly the same value as in the backend                                                   |
| `JWT_REFRESH_SECRET`                        | Must be exactly the same value as in the backend                                                   |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`              | Google OAuth client ID for Google sign-in                                                          |
| `NEXT_PUBLIC_DEMO_<ROLE>_EMAIL`             | Email shown on the demo login buttons (ADMIN, OWNER, MANAGER, TENANT)                              |
| `DEMO_<ROLE>_EMAIL`, `DEMO_<ROLE>_PASSWORD` | Used on the server by the demo login buttons                                                       |

Then:

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
```

---

## Project structure

```
src/
  app/            routes, grouped by area: (auth), (admin), (owner), (tenant) and public pages
  components/
    ui/           shadcn/ui building blocks
    shared/       shared pieces (dashboard shell, user menu, verification banner ...)
  hooks/          data hooks
  lib/            API client, helpers, permissions, formatters
docs/             written specifications the app was built from
```

---

## Future work

- Platform-tracked rent and bill splitting between roommates (today the lease holder pays the owner and the app shows a suggested equal split to settle directly)

---

## Author

**Sheikh Hasib Uzzaman**
GitHub: [github.com/Sheikhasib](https://github.com/Sheikhasib)
LinkedIn: [linkedin.com/in/sheikh-hasib-uzzaman](https://www.linkedin.com/in/sheikh-hasib-uzzaman)
