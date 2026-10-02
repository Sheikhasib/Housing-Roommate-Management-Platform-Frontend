# Spec 01 — Auth & Email Verification

## Overview

Authentication for all five roles. Email/password registration is **two-step**: `POST /register` only stages a bcrypt-hashed payload + 6-digit OTP in Redis (5 min) and emails it; `POST /verify-email` validates the OTP and creates the User transactionally with a role profile (`TENANT` → `TenantProfile`, `OWNER` → `OwnerProfile` with `verificationStatus: PENDING`, `PROPERTY_MANAGER` → `ManagerProfile`), then returns tokens. Login, logout, refresh, `GET /me`, Google OAuth (link-or-create), and password reset via OTP round out the module. Tokens are delivered as httpOnly cookies (24h access / 7d refresh).

## Depends on

- `prisma/schema/user.prisma`, `tenant.prisma`, `owner.prisma`, `enums.prisma`
- `src/app/middleware/checkAuth.ts` (`auth`), `validateRequest.ts`
- `src/app/utils/jwt.ts`, `email.ts` (`sendTemplateEmail`), `notification.ts` (`createNotification`)
- `src/app/lib/redis.ts` (OTP + registration staging), `googleAuth.ts`, `rateLimiter.ts`
- Templates: `registration-otp`, `welcome`, `forgot-password`, `reset-password-success`
- Mount: `/api/v1/auth` in `src/app/app.ts`

## API endpoints

All public endpoints except `logout`/`me` also carry `authRateLimiter` (20 req / 15 min; 429 body `{ success: false, statusCode: 429, message: "Too many authentication attempts. Please try again after 15 minutes.", errors: [{ message: "Rate limit exceeded for authentication endpoints" }] }`). `refresh-token` has no per-endpoint limiter (only the general one).

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | authRateLimiter, validateRequest(registerZodSchema) | 201 `"Verification OTP sent successfully"` (`data: null`) | Public |
| POST | `/api/v1/auth/verify-email` | authRateLimiter, validateRequest(verifyEmailZodSchema) | 200 `"Email verified successfully"` | Public |
| POST | `/api/v1/auth/login` | authRateLimiter, validateRequest(LoginZodSchema) | 200 `"User logged in successfully"` | Public |
| POST | `/api/v1/auth/logout` | auth() | 200 `"User logged out successfully"` | Any logged-in user |
| GET | `/api/v1/auth/me` | auth(all 5 roles) | 200 `"User profile fetched successfully"` | Protected |
| POST | `/api/v1/auth/refresh-token` | none (reads `refreshToken` cookie) | 200 `"New tokens generated successfully"` | Cookie required |
| POST | `/api/v1/auth/google` | authRateLimiter, validateRequest(GoogleLoginZodSchema) | 200 `"Google login successful"` | Public |
| POST | `/api/v1/auth/forgot-password` | authRateLimiter, validateRequest(ForgotPasswordZodSchema) | 200 `"OTP sent to Email: <email>"` | Public |
| POST | `/api/v1/auth/reset-password` | authRateLimiter, validateRequest(ResetPasswordZodSchema) | 200 `"Password reset successfully"` | Public |

## Request/response contracts

**Password rule (shared `passwordSchema`, reused by register, login, reset-password):** string, min 4, max 32, must contain one uppercase, one lowercase, one digit, and one special character.

**`register`** body:
| Field | Rule |
|---|---|
| `name` | string, min 3 / max 30 |
| `email` | valid email |
| `password` | passwordSchema |
| `role` | optional enum `TENANT` \| `OWNER` \| `PROPERTY_MANAGER` (default TENANT) |
| `profile` | optional object; `superRefine`: if TENANT re-parses as `tenantProfileSchema` (`contactNumber`, `gender` MALE/FEMALE/OTHER, `occupation`, `preferredCity`, `monthlyBudgetMax` int positive, `smoker`, `petFriendly`, `lookingForRoommate` — all optional); if OWNER parses `ownerProfileSchema` (`contactNumber`, `companyName`, `address`); if PROPERTY_MANAGER parses `managerProfileSchema` (`contactNumber`, `bio`) |

Register returns `data: null`; side effects only (Redis keys `register-otp:<email>` + `register-data:<email>`, EX 300s; OTP email).

**`verify-email`** body: `email` (valid), `otp` (exactly 6 chars). Response `data`: `{ accessToken, refreshToken, user (password omitted), roleProfile }`.

**`login`** body: `email`, `password`. Response `data`: `{ accessToken, refreshToken }` only.

**`google`** body: `idToken` (min 1). Response `data`: `{ accessToken, refreshToken }`.

**`forgot-password`** body: `email`. `reset-password` body: `email`, `newPassword`, `otp` (6 chars).

**`refresh-token`** reads the cookie; missing → 401 `"Refresh token is missing"`.

## Business rules

- `register`: email normalized (trim + lowercase); existing user → 409 `"User with this email already exists"`; password bcrypt-hashed (`BCRYPT_SALT_ROUNDS`); OTP = `crypto.randomInt(100000, 1000000)`.
- `verify-email`: existing Google account → 409 `"An account with this email already exists via Google. Please use Google login."`; already verified → 409 `"Email is already verified"`; other existing user → 409 `"An account with this email already exists. Please login instead."`; OTP missing/expired → 400 `"OTP has expired. Please register again to receive a new OTP."`; mismatch → 400 `"OTP does not match"`; staged data gone → 404 `"Registration data not found. Please register again."`. Role is coerced to OWNER/PROPERTY_MANAGER only if the staged role matches (ADMIN/SUPER_ADMIN can never self-register). Transactional create with nested profile; owner profile starts PENDING. Emails `welcome`, creates SYSTEM notification `"Welcome aboard 👋"`, mints tokens.
- `login`: missing user → 404 `"User not found"`; BLOCKED → 403 `"User is blocked"`; deleted → 404 `"User is deleted"`; Google-only account (password null or googleId set) → 409 `"User already has an account registered with Google. Please use Google login."`; wrong password → 401 `"Invalid credentials"`. Does not require `emailVerified`.
- `google`: verifies ID token (`verifyIdToken` + audience). Missing/invalid → 401 `"Invalid or Expired Google ID token"`; no name → 400 `"Google ID token does not contain name"`; no email → 400 `"Google ID token does not contain email"`. Resolution order: (1) existing user by email+googleId → login; (2) existing CREDENTIAL account by email → link `googleId` + mark verified (blocked → 403 `"User is blocked"`, deleted → 404); (3) else create TENANT with `GOOGLE` provider, verified, picture, nested TenantProfile + welcome email. Final guards: BLOCKED → 403 `"User Is Blocked"`; deleted → 404 `"User Is Deleted"`.
- `refresh-token`: verify against refresh secret; dev returns the actual verify error, else 401 `"Invalid refresh token"`; missing/inactive user (status ≠ ACTIVE incl. BLOCKED) → 404 `"User is inactive or not found"`; issues a fresh pair (stateless rotation; old refresh token stays valid until expiry).
- `forgot-password`/`reset-password`: guards in order — user 404 `"User not found"`; BLOCKED → 403 `"User is blocked"`; unverified → 403 `"Email is not verified"`; deleted → 404 `"User is deleted"`; any account with a `googleId` (login is Google-only for those, so a password could never be used) → 409 `"User already has an account registered with Google. Please use Google login."`. Forgot stores `forgot-password-otp:<email>` (EX 300s) and emails OTP. Reset checks OTP (`400 "Invalid OTP"` / `400 "OTP does not match"`), bcrypts, updates, clears the Redis key, emails `reset-password-success`.
- `logout` clears both cookies.
- `getMe`: returns the full user row (password omitted) with `tenantProfile`, `ownerProfile` and `managerProfile`; 404 `"User not found"`.

## Data model

`User` (`users`): `id uuid`, `name`, `email` (@@unique), `password?`, `googleId? @unique`, `authProvider` (default CREDENTIAL), `emailVerified`, `role` (default TENANT), `status` (default ACTIVE), `needPasswordChange`, `imageUrl?`/`imagePublicId?` (default ""), soft-delete fields, timestamps; relations `tenantProfile?`, `ownerProfile?`, `managerProfile?`, `notifications[]`; index `[role, status]`. `TenantProfile`/`OwnerProfile`/`ManagerProfile` created 1:1 from the verified role (schema change: `managerProfile` 1:1 added by P1).

## Notes

- Cookies: `accessToken`/`refreshToken` set on verify-email/login/google/refresh; `secure` only in production; `sameSite: "none"`; cleared on logout.
- OTP TTL is 5 minutes (`expirationMinutes: 5`); OTP is numeric and 6 digits.
- Refresh-token endpoint is not rate-limited beyond the general limiter.

## Definition of done

- [ ] Register a TENANT, an OWNER, and a PROPERTY_MANAGER → OTP email staged; no User row created yet.
- [ ] Wrong/missing OTP returns 400; correct OTP creates the user + role profile (owner PENDING, manager created as-is) and returns tokens in cookies + welcome notification.
- [ ] Register duplicate email → 409.
- [ ] Login works for a verified user; wrong password → 401; BLOCKED user → 403.
- [ ] `GET /auth/me` returns user + profile for all five roles; unauthenticated → 401.
- [ ] Google login links an existing credential account and creates a new TENANT otherwise.
- [ ] Forgot → reset flow changes the password (old password then fails login).
- [ ] `npm run lint:check`, `npm run format:check`, `npm run build` pass.
