# 04: Profile and verification

Priority: P0 · Backend specs: 02 (user), 03 (tenant), 04 (owner) · Depends on: 01-foundation, 02-auth

## Goal
Every role can update their name and picture. Tenants maintain roommate-matching preferences and submit an identity document. Owners maintain company details, upload verification documents and request review. Status banners tell users what they may do next.

## Tech used
`@tanstack/react-form` + Zod (strict schemas), TanStack Query mutations with cache invalidation of `me`, `FileUploader` with `uploadWithProgress`, `StatusBadge`. Base stack: see 01-foundation.

## Roles
TENANT, OWNER and ADMIN or SUPER_ADMIN use this spec. PROPERTY_MANAGER profile fields are in 17-manager-role (name and picture use the shared account section here).

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/dashboard/profile` | Tabs: Account, Preferences, Verification | TENANT | Client | P0 |
| `/owner/profile` | Tabs: Account, Company, Verification (owners only) | OWNER (manager: see 17) | Client | P0 |
| `/admin/profile` | Account only (picture and name) | ADMIN, SUPER_ADMIN | Client | P0 |

Shared across all three: an `AccountSection` component (avatar upload and name form).

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| PATCH | `/api/v1/user/profile-image` | SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT | multipart single("profileImage") | Upload avatar |
| PATCH | `/api/v1/user/update-me` | SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT | updateProfileZodSchema | Update display name |
| GET | `/api/v1/tenant/me` | TENANT | — | Tenant profile with verification status |
| PATCH | `/api/v1/tenant/update-me` | TENANT | UpdateTenantProfileZodSchema | Update preferences |
| PATCH | `/api/v1/tenant/verification-document` | TENANT | multipart single("document") | Upload identity document, status resets to PENDING |
| GET | `/api/v1/owner/me` | OWNER | — | Owner profile with verification status and documents |
| PATCH | `/api/v1/owner/update-me` | OWNER | UpdateOwnerProfileZodSchema | Update company details |
| POST | `/api/v1/owner/verification-documents` | OWNER | multipart array("documents", max 5) | Upload up to 5 documents (append only) |
| DELETE | `/api/v1/owner/verification-documents` | OWNER | — | Remove one document by `publicId` |
| POST | `/api/v1/owner/request-verification` | OWNER | — | Ask admin to review (status back to PENDING) |

Also used here: `GET /api/v1/auth/me` (session user).

## Zod schemas
Source: backend `user.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const updateProfileZodSchema = z
  .object({
    name: z
      .string("Not a string.")
      .min(3, "Name must be at least 3 characters long")
      .max(30, "Name must be at most 30 characters long")
      .optional(),
  })
  .strict();
```

Source: backend `tenant.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"], "Invalid gender.");

const UpdateTenantProfileZodSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    gender: genderEnum.optional(),
    dateOfBirth: z
      .string("Not a string.")
      .datetime({ offset: true, message: "dateOfBirth must be a valid date" })
      .optional()
      .or(z.date().optional()),
    occupation: z.string("Not a string.").optional(),
    bio: z
      .string("Not a string.")
      .max(500, "Bio must be at most 500 characters long")
      .optional(),
    preferredCity: z.string("Not a string.").optional(),
    monthlyBudgetMax: z
      .number("Budget must be a number.")
      .int("Budget must be an integer.")
      .positive("Budget must be positive.")
      .max(1000000, "Budget seems unrealistically high.")
      .optional(),
    moveInDate: z
      .string("Not a string.")
      .datetime({ offset: true, message: "moveInDate must be a valid date" })
      .optional()
      .or(z.date().optional()),
    smoker: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
    hasPets: z.boolean().optional(),
    lookingForRoommate: z.boolean().optional(),
  })
  .strict();
```

Source: backend `owner.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const UpdateOwnerProfileZodSchema = z
  .object({
    contactNumber: z
      .string("Not a string.")
      .min(8, "Contact number must be at least 8 characters long")
      .optional(),
    companyName: z
      .string("Not a string.")
      .min(2, "Company name must be at least 2 characters long")
      .optional(),
    address: z.string("Not a string.").optional(),
  })
  .strict();
```

Notes: all three schemas are `.strict()`, so send only the listed keys and omit empty fields (turn empty strings into `undefined`). Do not send `name` or `email` to `/tenant/update-me` or `/owner/update-me`; the name changes only through `/user/update-me`. Dates must be ISO datetimes with offset. `DELETE /owner/verification-documents` takes JSON `{ publicId }` (no schema; required).

## Data and state
- Query keys: `["me"]` (auth me), `["tenant","me"]`, `["owner","me"]`. Every successful mutation invalidates `["me"]` and the role profile key.
- Avatar upload: field `profileImage`, preview, progress, max 8 MB, jpeg/png/webp/gif. The response is the updated user; refresh `["me"]` so the shell avatar updates.
- Tenant verification: field `document`, one file, images or PDF, 8 MB. A new upload replaces the old one and sets status to PENDING (clears the rejection reason).
- Owner documents: field `documents`, up to 5 files per request, images or PDF, appended. Removal writes first, then deletes the asset.
- Documents are `{ url, publicId }`. Show image thumbnails; PDFs show a file chip that opens in a new tab.

## States
- Verification status panel for tenant and owner: PENDING (waiting for admin review), APPROVED (green check), REJECTED (shows `rejectionReason` and a "Submit again" action). A tenant without an uploaded document sees an upload prompt.
- Owner with status PENDING and no documents: "Upload your documents, then request verification".
- Loading skeleton per tab; inline field errors; toasts for success and failure.

## UX notes
- Global banners (rendered by the area layout, not by this page): tenant area when `verificationStatus !== APPROVED` ("Verify your identity to pay deposits and invoices", link to `/dashboard/profile`); owner area (OWNER only) when not APPROVED ("An admin must approve your account before you can list properties").
- Preferences form: lifestyle switches (smoker, petFriendly, hasPets, lookingForRoommate), budget, preferred city, move-in date, occupation, bio (counter to 500), gender, date of birth, contact number. Turning on `lookingForRoommate` explains it unlocks roommate matching (13-roommates).
- Owner company form: contact number (min 8), company name (min 2), address.
- Request verification button is disabled while status is PENDING and needs at least one document.
- Unsaved-changes guard is optional.

## Backend rules the UI must respect
- Owners must be APPROVED before creating properties, rooms and leases (403 otherwise). Tenants must be APPROVED before starting a payment session (403 "Your tenant account is not verified yet…").
- Re-requesting owner verification while PENDING gives 409 "Owner verification is already pending". Updating owner contact fields does not reset verification.
- Admin reviews happen in 16-admin; the tenant or owner is emailed and notified when reviewed.
- `GET /tenant/me` returns `verificationStatus`, `verificationDocUrl`, `rejectionReason`; `GET /owner/me` returns `verificationStatus`, `rejectionReason`, `documents`.

## Acceptance checklist
- [ ] Any role uploads an avatar and changes their name; the shell updates without a reload.
- [ ] Tenant saves preferences; an unknown key or a budget above 1,000,000 shows the validation message.
- [ ] Tenant uploads a verification document; status shows PENDING; after admin rejection the reason shows and re-upload works.
- [ ] Owner uploads up to 5 documents, removes one, requests verification; duplicate request shows 409 text.
- [ ] Banners show only for the roles and statuses described.
- [ ] Upload progress and preview work; a file over 8 MB or a wrong type is blocked on the client.

## Out of scope
Email change, password change while logged in (no endpoint), account deletion, manager fields (see 17-manager-role).
