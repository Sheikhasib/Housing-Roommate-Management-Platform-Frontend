import type { Metadata } from "next";

import { LegalDocument } from "@/components/shared/legal-document";
import { APP_NAME } from "@/lib/constants";
import { TERMS_SECTIONS } from "@/lib/legal";

const DESCRIPTION = `The rules for using ${APP_NAME}: accounts, listings, applications, deposits, payments and refunds.`;

export const metadata: Metadata = {
  title: "Terms of service",
  description: DESCRIPTION,
};

export default function TermsPage() {
  return <LegalDocument title="Terms of service" description={DESCRIPTION} sections={TERMS_SECTIONS} />;
}
