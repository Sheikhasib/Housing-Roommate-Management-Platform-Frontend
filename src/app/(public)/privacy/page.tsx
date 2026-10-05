import type { Metadata } from "next";

import { LegalDocument } from "@/components/shared/legal-document";
import { APP_NAME } from "@/lib/constants";
import { PRIVACY_SECTIONS } from "@/lib/legal";

const DESCRIPTION = `What ${APP_NAME} collects, how it is used, who can see it and the choices you have.`;

export const metadata: Metadata = {
  title: "Privacy policy",
  description: DESCRIPTION,
};

export default function PrivacyPage() {
  return <LegalDocument title="Privacy policy" description={DESCRIPTION} sections={PRIVACY_SECTIONS} />;
}
