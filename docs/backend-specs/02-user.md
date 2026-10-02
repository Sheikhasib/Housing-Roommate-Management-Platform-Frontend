# Spec 02 — User Profile & Profile Image

## Overview

Self-service account basics shared by every role: upload a profile picture to Cloudinary and update the display `name`. Updating `name` keeps the denormalized name on the user's role profile (`TenantProfile`/`OwnerProfile`/`ManagerProfile`) in sync inside a transaction. All five roles may call both endpoints; there are no admin-only routes here (admin user management lives in spec 15).

## Depends on

- `prisma/schema/user.prisma`, `tenant.prisma`, `owner.prisma`, `manager.prisma`
- `src/app/middleware/checkAuth.ts` (`auth` with all 5 roles)
- `src/app/utils/cloudinaryUpload.ts`, `src/app/lib/multer.ts`, `src/app/lib/cloudinary.ts`
- `src/app/module/user/*` (route/controller/service/validation)
- Mount: `/api/v1/user` in `src/app/app.ts`

## API endpoints

| Method | Path | Middleware | Success (code + message) | Access |
|---|---|---|---|---|
| PATCH | `/api/v1/user/profile-image` | auth(SUPER_ADMIN, ADMIN, OWNER, PROPERTY_MANAGER, TENANT), upload.single("profileImage") | 200 `"User profile image uploaded successfully"` | Protected (any role) |
| PATCH | `/api/v1/user/update-me` | auth(all 5 roles), validateRequest(updateProfileZodSchema) | 200 `"Profile updated successfully"` | Protected (any role) |

## Request/response contracts

**`profile-image`** — `multipart/form-data`, field `profileImage` (single file, memory buffer; `uploadImages`: jpeg/png/webp/gif, 8 MB limit). No zod. Controller: no file → 400 `"No file uploaded"`. Response `data`: the updated `User` row (password omitted) with `imageUrl`/`imagePublicId` set.

**`update-me`** — body zod schema (`updateProfileZodSchema`, strict):

| Field | Rule |
|---|---|
| `name` | optional string, min 3 (`"Name must be at least 3 characters long"`), max 30 (`"Name must be at most 30 characters long"`) |

Empty object `{}` passes and is a no-op. Response `data`: the updated `User` row (password omitted).

## Business rules

- `uploadProfileImage(buffer, userId)`: upload to Cloudinary via `upload_stream` (`resource_type: "auto"`); failure → 502 `"Failed to upload image to Cloudinary"`. Update the user's `imageUrl`/`imagePublicId`, then best-effort `cloudinary.uploader.destroy` of the previous image (only if the user previously had both `imageUrl` and `imagePublicId`). Returns the updated user row.
- `updateUserProfile(userId, { name })`: user lookup; missing → 404 `"User not found"`; re-check name ≥ 3 → 400 `"Name must be at least 3 characters long"`. Transaction: update `User.name`; if a `TenantProfile` exists update its `name`; if an `OwnerProfile` exists update its `name`; if a `ManagerProfile` exists update its `name`. Email is never synced here.

## Data model

`User` profile-image fields `imageUrl`/`imagePublicId`; `TenantProfile.name`/`email`, `OwnerProfile.name`/`email` and `ManagerProfile.name`/`email` are denormalized copies kept for the profile listings.

## Definition of done

- [ ] Upload a profile image (any role) → user's `imageUrl` updates and old Cloudinary asset is removed.
- [ ] `PATCH /user/update-me` with a new name updates `User.name` and the role profile's `name` atomically.
- [ ] `name` shorter than 3 → 400; unknown body keys on `update-me` → 400 with structured errors.
- [ ] Unauthenticated → 401; `lint:check`/`format:check`/`build` pass.
