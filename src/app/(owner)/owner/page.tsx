// TEMPORARY placeholder to check the Owner shell in both themes. Delete in the overview feature spec.
import { Building2, CalendarClock, FileText, Receipt } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

export default function OwnerPlaceholderPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Your properties, applications and invoices will appear here." />
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Properties" value="—" icon={Building2} />
        <StatCard label="Viewings" value="—" icon={CalendarClock} />
        <StatCard label="Applications" value="—" icon={FileText} />
        <StatCard label="Invoices" value="—" icon={Receipt} />
      </div>
    </div>
  );
}
