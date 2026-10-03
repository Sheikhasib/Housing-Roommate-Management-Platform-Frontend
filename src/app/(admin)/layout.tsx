import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <DashboardShell area="admin">{children}</DashboardShell>;
}
