import type { Metadata } from "next";

import { DashboardShell } from "@/components/shared/dashboard-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OwnerLayout({ children }: LayoutProps<"/">) {
  return <DashboardShell area="owner">{children}</DashboardShell>;
}
