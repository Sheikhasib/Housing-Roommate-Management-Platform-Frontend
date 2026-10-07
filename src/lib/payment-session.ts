import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { verifyAccessToken, type SessionPayload } from "@/lib/auth/jwt";

/**
 * The payment return pages are public routes (`proxy.ts` does not guard `/payment/*`), so they check the
 * session themselves: without one the visitor goes to the login page and comes back to this same URL.
 */
export async function requirePaymentSession(returnTo: string): Promise<SessionPayload> {
  const session = await verifyAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);
  if (!session) redirect(`/login?redirectTo=${encodeURIComponent(returnTo)}`);
  return session;
}
