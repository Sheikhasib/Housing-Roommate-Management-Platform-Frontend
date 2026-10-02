# 02: Auth

Priority: P0 · Backend spec: 01 (auth and email verification) · Depends on: 01-foundation

## Goal
Guests can register as Tenant, Owner or Property Manager, verify their email with an OTP, log in (including one-click demo login for every role), recover a password, and log out. Sessions are kept in httpOnly cookies on the frontend domain and refreshed silently.

## Tech used
Server Actions for every call that returns tokens, `@tanstack/react-form` + Zod for all forms, `proxy.ts` for route protection, `useGetMe` (TanStack Query) for the client session, Sonner for feedback. Base stack: see 01-foundation.

## Roles
Guests (login, register, verify, forgot, reset). Any logged-in role (logout, session). ADMIN and SUPER_ADMIN can never self-register.

## Pages and routes
| Route | Page | Roles | Rendering | Priority |
|---|---|---|---|---|
| `/login` | Email and password login, **Continue with Google**, plus **3 Demo Login buttons that auto-fill the form and sign in** (Admin, Owner, Tenant) and a collapsed "More demo accounts" block (Property Manager, Super Admin) | guests | Client form in Server page | P0 |
| `/register` | 2-step wizard: step 1 account (name, email, password, role card), step 2 optional role profile | guests | Client | P0 |
| `/verify-email` | 6-digit OTP entry, 5-minute countdown | guests | Client | P0 |
| `/forgot-password` | Request OTP | guests | Client | P1 |
| `/reset-password` | OTP and new password | guests | Client | P1 |

Google login (**Continue with Google** on `/login` and `/register`): P0. It uses `@react-oauth/google` (approved) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; the owner must create the Google OAuth client and add the local and deployed origins. Facebook is not offered: the backend supports Google only.

## Endpoints
| Method | Path | Access | Body / upload | Used for |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | registerZodSchema | Step 1: stages data and emails an OTP (no user yet) |
| POST | `/api/v1/auth/verify-email` | Public | verifyEmailZodSchema | Creates the user and returns tokens |
| POST | `/api/v1/auth/login` | Public | LoginZodSchema | Returns tokens |
| POST | `/api/v1/auth/logout` | Any logged-in user | — | Clears backend cookies; frontend also clears its own |
| GET | `/api/v1/auth/me` | SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT | — | Current user with tenant, owner and manager profile (used by `useGetMe`) |
| POST | `/api/v1/auth/refresh-token` | Public | — | Used by `proxy.ts` and `refreshSession`, never by pages |
| POST | `/api/v1/auth/google` | Public | GoogleLoginZodSchema | Google ID token login |
| POST | `/api/v1/auth/forgot-password` | Public | ForgotPasswordZodSchema | Sends reset OTP |
| POST | `/api/v1/auth/reset-password` | Public | ResetPasswordZodSchema | Verifies OTP and sets a new password |

## Zod schemas
Source: backend `auth.validation.ts`. Mirror these rules exactly (same messages). Zod 4.

```ts
const passwordSchema = z
  .string()
  .min(4, "Password must be at least 4 characters long")
  .max(32, "Password must be at most 32 characters long")
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one digit" })
  .regex(/[^A-Za-z0-9]/, {
    message: "Password must contain at least one special character",
  });

const tenantProfileSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], "Invalid gender.").optional(),
    occupation: z.string("Not a string.").optional(),
    preferredCity: z.string("Not a string.").optional(),
    monthlyBudgetMax: z
      .number("Budget must be a number.")
      .int()
      .positive()
      .optional(),
    smoker: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
    lookingForRoommate: z.boolean().optional(),
  })
  .optional();

const ownerProfileSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    companyName: z.string("Not a string.").optional(),
    address: z.string("Not a string.").optional(),
  })
  .optional();

const managerProfileSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    bio: z.string("Not a string.").optional(),
  })
  .optional();

const registerZodSchema = z
  .object({
    name: z
      .string("Not a string.")
      .min(3, "Name must be at least 3 characters long")
      .max(30, "Name must be at most 30 characters long"),
    email: z.email("Not a valid email address."),
    password: passwordSchema,
    role: z
      .enum(
        ["TENANT", "OWNER", "PROPERTY_MANAGER"],
        "Role must be TENANT, OWNER or PROPERTY_MANAGER.",
      )
      .default("TENANT"),
    profile: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    // validate `profile` depending on the chosen role
    if (data.role === "TENANT") {
      const result = tenantProfileSchema.safeParse(data.profile);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: "custom",
            path: issue.path,
            message: issue.message,
          });
        });
      }
    }

    if (data.role === "OWNER") {
      const result = ownerProfileSchema.safeParse(data.profile);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: "custom",
            path: issue.path,
            message: issue.message,
          });
        });
      }
    }

    if (data.role === "PROPERTY_MANAGER") {
      const result = managerProfileSchema.safeParse(data.profile);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: "custom",
            path: issue.path,
            message: issue.message,
          });
        });
      }
    }
  });

const verifyEmailZodSchema = z.object({
  email: z.email("Not a valid email address."),
  otp: z.string().length(6, "OTP must be exactly 6 characters"),
});

const LoginZodSchema = z.object({
  email: z.email("Not a valid email address."),
  password: passwordSchema,
});

const ForgotPasswordZodSchema = z.object({
  email: z.email("Not a valid email address."),
});

const ResetPasswordZodSchema = z.object({
  email: z.email("Not a valid email address."),
  newPassword: passwordSchema,
  otp: z.string().length(6, "OTP must be exactly 6 characters"),
});

const GoogleLoginZodSchema = z.object({
  idToken: z.string().min(1, "Google id token is required"),
});
```

Notes for the frontend copies: `LoginZodSchema` uses the full password rules, so demo passwords must satisfy them. For `register`, send `profile` only when at least one field is filled, and only the keys for the chosen role (tenant: `contactNumber, gender, occupation, preferredCity, monthlyBudgetMax, smoker, petFriendly, lookingForRoommate`; owner: `contactNumber, companyName, address`; manager: `contactNumber, bio`). Define the role-specific profile schemas on the client and validate the matching one per role.

## Data and state
- Server Actions (in `src/lib/auth/actions.ts`): `loginAction`, `demoLoginAction(role)`, `registerAction`, `verifyEmailAction`, `forgotPasswordAction`, `resetPasswordAction`, `googleAuthAction` (P1), `logoutAction`, `refreshSession`. Each returns `{ ok: true } | { ok: false, message, fieldErrors? }` and redirects on success.
- On any token response the action stores `accessToken` (max-age 1 day) and `refreshToken` (7 days) as httpOnly, `sameSite: lax`, `path: /`, `secure` in production cookies on the frontend domain. `login` returns tokens only, so read the role from the JWT payload `{ userId, name, email, role }` to choose the redirect.
- Redirect after login or verification: a safe `redirectTo` query param (must start with `/` and not `//`) else the role home. `proxy.ts` corrects a wrong-area target.
- **Demo login (auto-fill):** clicking a demo card fills the email field with `NEXT_PUBLIC_DEMO_<ROLE>_EMAIL`, fills the password field with a masked placeholder (dots only; the real password never reaches the client), shows the loading state, then calls `demoLoginAction(role)`, which reads `DEMO_<ROLE>_EMAIL` and `_PASSWORD` from server env and calls the same login endpoint.
- Client session: `useGetMe` calls `GET /auth/me`. Logout invalidates the query cache.
- `proxy.ts` and `refreshSession` are specified in 01-foundation.

## States
- Submit buttons show a pending state; disable while pending. 429 shows the backend rate-limit message and a short disabled period.
- `/verify-email` without an `email` query param redirects to `/register`. Expired OTP: offer "Register again" (there is no resend endpoint).
- Server-side field errors from `errors[]` attach to the matching input.

## UX notes
- Login layout: **Continue with Google**, a divider "OR", the email and password form, a divider "OR", then "Quick demo login" with 3 equal cards (icon, role name, **Demo Login** button), then a small "More demo accounts" disclosure. Each demo button visibly fills the form, signs in and lands on the role dashboard.
- Google: the button gets an ID token from Google and calls `googleAuthAction(idToken)`. The backend decides the role of a new Google user and whether an existing account is reused; read `docs/backend-specs/01-auth.md` for the rules and show its messages verbatim.
- Password inputs: show/hide toggle and a live checklist of the 4 rules.
- Role cards on register: Tenant, Owner, Property Manager with one-line explanations. An Owner sees a note that an admin must approve the account before listing properties.
- After OWNER verification the user lands on `/owner` where the pending-verification banner explains the next step. After TENANT verification the user lands on `/dashboard` with the identity banner.
- Password reset success redirects to `/login` with a success toast.

## Backend rules the UI must respect
- Register is two-step: nothing is created until `verify-email` succeeds. Existing email gives 409 "User with this email already exists".
- `verify-email` errors to show verbatim: OTP expired (400), OTP does not match (400), registration data not found (404), already verified or existing account (409), Google account exists (409, tell the user to use Google login).
- `login` errors: 404 user not found or deleted, 403 blocked ("User is blocked"), 409 Google-only account (use Google login), 401 invalid credentials. Login does not require a verified email.
- `forgot-password` and `reset-password` guards: unknown user 404, blocked 403, unverified email 403, Google account 409. OTP lasts 5 minutes.
- `refresh-token` has no per-endpoint rate limit. A blocked or inactive user gets 404 on refresh: clear the session.
- Auth POST endpoints are limited to 20 requests per 15 minutes (429 body message "Too many authentication attempts. Please try again after 15 minutes.").
- ADMIN and SUPER_ADMIN accounts are seeded; the register role field offers only TENANT, OWNER, PROPERTY_MANAGER.

## Acceptance checklist
- [ ] Demo buttons visibly fill the email and a masked password, then log in as Admin, Owner, Tenant and land on `/admin`, `/owner`, `/dashboard`; the secondary block logs in Manager (`/owner`) and Super Admin (`/admin`).
- [ ] Continue with Google works on login and register and lands on the right home.
- [ ] Register as each of the 3 roles, enter the OTP, and land on the right home.
- [ ] Wrong OTP and expired OTP show the backend message; duplicate email shows 409 text.
- [ ] Login with a wrong password shows 401 text; a blocked user sees the blocked message.
- [ ] Forgot then reset changes the password; the old password fails.
- [ ] Visiting `/admin` as a tenant redirects to `/dashboard`; visiting `/dashboard` as a guest redirects to `/login?redirectTo=...`.
- [ ] Expired access token with a valid refresh token continues without a visible logout.
- [ ] Logout clears cookies and the query cache, then goes to `/login`.
- [ ] No token appears in `localStorage`, logs or the client bundle; demo credentials are not in the client bundle.

## Out of scope
Email resend endpoint (does not exist), Facebook login (the backend supports Google only), remember-me, multi-factor authentication.
