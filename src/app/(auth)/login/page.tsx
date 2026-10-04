import type { Metadata } from "next";

import { getSafeRedirect } from "@/lib/auth/jwt";
import { APP_NAME } from "@/lib/constants";

import { LoginForm } from "../_components/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: `Log in to your ${APP_NAME} account.`,
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { redirectTo } = await searchParams;
  const target = getSafeRedirect(typeof redirectTo === "string" ? redirectTo : null);
  return <LoginForm redirectTo={target} />;
}
