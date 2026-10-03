"use server";

import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api/apiError";
import { requestTokenRefresh } from "@/lib/api/refreshApi";
import { serverApi } from "@/lib/api/serverApi";
import type { AuthTokens } from "@/lib/auth/constants";
import { clearSessionCookies, getRefreshToken, setSessionCookies } from "@/lib/auth/cookies";
import { getSafeRedirect, verifyAccessToken } from "@/lib/auth/jwt";
import { canAccessPath, getRoleHome } from "@/lib/permissions";
import type { ApiSuccess } from "@/types/api";
import {
  forgotPasswordZodSchema,
  googleLoginZodSchema,
  registerZodSchema,
  resetPasswordZodSchema,
  verifyEmailZodSchema,
  zodFieldErrors,
  type RegisterInput,
} from "@/validation/auth";
import { ROLES, type Role } from "@/validation/enums";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; status?: number; fieldErrors?: Record<string, string> };

/** Env key used by the DEMO_<KEY>_EMAIL and DEMO_<KEY>_PASSWORD server variables. */
const DEMO_ENV_KEY: Record<Role, string> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  PROPERTY_MANAGER: "MANAGER",
  TENANT: "TENANT",
};

function failure(error: unknown): ActionResult {
  if (error instanceof ApiError) {
    const fieldErrors: Record<string, string> = {};
    for (const item of error.errors) {
      if (item.field && !(item.field in fieldErrors)) fieldErrors[item.field] = item.message;
    }
    return {
      ok: false,
      message: error.message,
      status: error.status,
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    };
  }
  return { ok: false, message: "Something went wrong. Try again" };
}

/** Stores the tokens, then redirects to a safe `redirectTo` or the role home. Only returns on failure. */
async function startSession(tokens: AuthTokens, redirectTo?: string | null): Promise<ActionResult> {
  const session = await verifyAccessToken(tokens.accessToken);
  if (!session) {
    return { ok: false, message: "Could not start your session. Try again" };
  }
  await setSessionCookies(tokens);
  const target = getSafeRedirect(redirectTo);
  redirect(target && canAccessPath(session.role, target) ? target : getRoleHome(session.role));
}

async function loginWithCredentials(
  email: string,
  password: string,
  redirectTo?: string | null,
): Promise<ActionResult> {
  let tokens: AuthTokens;
  try {
    const response = await serverApi<ApiSuccess<AuthTokens>>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    tokens = response.data;
  } catch (error) {
    return failure(error);
  }
  return startSession(tokens, redirectTo);
}

export async function loginAction(input: {
  email: string;
  password: string;
  redirectTo?: string | null;
}): Promise<ActionResult> {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) {
    return {
      ok: false,
      message: "Enter your email and password",
      fieldErrors: {
        ...(email ? {} : { email: "Enter your email" }),
        ...(password ? {} : { password: "Enter your password" }),
      },
    };
  }
  return loginWithCredentials(email, password, input.redirectTo);
}

/** The password never leaves the server: it is read from DEMO_<ROLE>_PASSWORD here. */
export async function demoLoginAction(role: Role, redirectTo?: string | null): Promise<ActionResult> {
  if (!(ROLES as readonly string[]).includes(role)) {
    return { ok: false, message: "Demo login is not available for this account" };
  }
  const key = DEMO_ENV_KEY[role];
  const email = process.env[`DEMO_${key}_EMAIL`];
  const password = process.env[`DEMO_${key}_PASSWORD`];
  if (!email || !password) {
    return { ok: false, message: "Demo login is not available for this account" };
  }
  return loginWithCredentials(email, password, redirectTo);
}

function invalid(error: Parameters<typeof zodFieldErrors>[0]): ActionResult {
  const fieldErrors = zodFieldErrors(error);
  return {
    ok: false,
    message: Object.values(fieldErrors)[0] ?? "Check the highlighted fields",
    fieldErrors,
  };
}

/** Step 1 of registration: the backend stages the data and emails an OTP. No user exists yet. */
export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerZodSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await serverApi("/auth/register", { method: "POST", body: parsed.data });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function verifyEmailAction(input: {
  email: string;
  otp: string;
  redirectTo?: string | null;
}): Promise<ActionResult> {
  const parsed = verifyEmailZodSchema.safeParse({ email: input.email, otp: input.otp });
  if (!parsed.success) return invalid(parsed.error);
  let tokens: AuthTokens;
  try {
    const response = await serverApi<ApiSuccess<AuthTokens>>("/auth/verify-email", {
      method: "POST",
      body: parsed.data,
    });
    tokens = response.data;
  } catch (error) {
    return failure(error);
  }
  return startSession(tokens, input.redirectTo);
}

export async function forgotPasswordAction(input: { email: string }): Promise<ActionResult> {
  const parsed = forgotPasswordZodSchema.safeParse({ email: input.email });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await serverApi("/auth/forgot-password", { method: "POST", body: parsed.data });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function resetPasswordAction(input: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<ActionResult> {
  const parsed = resetPasswordZodSchema.safeParse({
    email: input.email,
    otp: input.otp,
    newPassword: input.newPassword,
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await serverApi("/auth/reset-password", { method: "POST", body: parsed.data });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

/** The backend decides the role of a new Google user and whether an existing account is linked. */
export async function googleAuthAction(
  idToken: string,
  redirectTo?: string | null,
): Promise<ActionResult> {
  const parsed = googleLoginZodSchema.safeParse({ idToken });
  if (!parsed.success) return invalid(parsed.error);
  let tokens: AuthTokens;
  try {
    const response = await serverApi<ApiSuccess<AuthTokens>>("/auth/google", {
      method: "POST",
      body: parsed.data,
    });
    tokens = response.data;
  } catch (error) {
    return failure(error);
  }
  return startSession(tokens, redirectTo);
}

export async function logoutAction(): Promise<void> {
  try {
    await serverApi("/auth/logout", { method: "POST" });
  } catch {
    // The backend call is best effort: the local session is cleared either way.
  }
  await clearSessionCookies();
  redirect("/login");
}

/**
 * Silent refresh for the browser client after a 401. Rotates the cookies and returns ok,
 * or clears the session when the backend rejects the refresh token.
 */
export async function refreshSession(): Promise<ActionResult> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return { ok: false, message: "Your session has ended. Log in again" };

  try {
    const tokens = await requestTokenRefresh(refreshToken);
    if (!tokens) {
      await clearSessionCookies();
      return { ok: false, message: "Your session has ended. Log in again" };
    }
    await setSessionCookies(tokens);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
