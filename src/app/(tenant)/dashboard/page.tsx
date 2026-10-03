// TEMPORARY placeholder to check the Tenant shell in both themes. Delete in the overview feature spec.
import { CreditCard, FileText, ScrollText, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

export default function TenantPlaceholderPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Your applications, leases and payments will appear here." />
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applications" value="—" icon={FileText} />
        <StatCard label="Active lease" value="—" icon={ScrollText} />
        <StatCard label="Unpaid invoices" value="—" icon={CreditCard} />
        <StatCard label="Open requests" value="—" icon={Wrench} />
      </div>
    </div>
  );
}
