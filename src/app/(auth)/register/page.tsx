import type { Metadata } from "next";

import { getSafeRedirect } from "@/lib/auth/jwt";

import { RegisterWizard } from "../_components/register-wizard";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Sign up as a tenant, owner or property manager.",
};

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { redirectTo } = await searchParams;
  const target = getSafeRedirect(typeof redirectTo === "string" ? redirectTo : null);
  return <RegisterWizard redirectTo={target} />;
}
