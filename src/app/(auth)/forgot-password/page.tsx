import type { Metadata } from "next";

import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a code to reset your password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
