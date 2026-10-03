import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "../_components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Enter your code and choose a new password.",
};

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { email } = await searchParams;
  if (typeof email !== "string" || !email) redirect("/forgot-password");
  return <ResetPasswordForm email={email} />;
}
