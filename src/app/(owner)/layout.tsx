import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function OwnerLayout({ children }: LayoutProps<"/">) {
  return <DashboardShell area="owner">{children}</DashboardShell>;
}
