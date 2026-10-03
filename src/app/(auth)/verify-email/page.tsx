import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSafeRedirect } from "@/lib/auth/jwt";

import { VerifyEmailForm } from "../_components/verify-email-form";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Enter the code we emailed you to finish creating your account.",
};

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { email, redirectTo } = await searchParams;
  if (typeof email !== "string" || !email) redirect("/register");
  const target = getSafeRedirect(typeof redirectTo === "string" ? redirectTo : null);
  return <VerifyEmailForm email={email} redirectTo={target} />;
}
