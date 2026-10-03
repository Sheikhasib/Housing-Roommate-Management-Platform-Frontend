import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function AccountLayout({ children }: LayoutProps<"/">) {
  return <DashboardShell>{children}</DashboardShell>;
}
