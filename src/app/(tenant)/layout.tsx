import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function TenantLayout({ children }: LayoutProps<"/">) {
  return <DashboardShell area="tenant">{children}</DashboardShell>;
}
