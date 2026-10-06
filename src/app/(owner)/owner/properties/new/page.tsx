import type { Metadata } from "next";

import { RoleGuard } from "@/components/shared/can";
import { PropertyWizard } from "./_components/property-wizard";

export const metadata: Metadata = {
  title: "Create property",
  robots: { index: false },
};

export default function NewPropertyPage() {
  return (
    <RoleGuard roles={["OWNER"]}>
      <PropertyWizard />
    </RoleGuard>
  );
}
