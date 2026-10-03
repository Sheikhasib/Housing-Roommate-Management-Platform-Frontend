// TEMPORARY placeholder to check the Admin shell in both themes. Delete in the overview feature spec.
import { Building2, ShieldCheck, Users, CreditCard } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

export default function AdminPlaceholderPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Platform users, verifications and payments will appear here." />
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value="—" icon={Users} />
        <StatCard label="Verifications" value="—" icon={ShieldCheck} />
        <StatCard label="Properties" value="—" icon={Building2} />
        <StatCard label="Payments" value="—" icon={CreditCard} />
      </div>
    </div>
  );
}
