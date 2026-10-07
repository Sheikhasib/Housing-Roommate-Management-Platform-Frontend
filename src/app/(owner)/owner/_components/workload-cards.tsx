import { CalendarClock, FileText, Wrench } from "lucide-react";

import { LinkedCard } from "@/app/(tenant)/dashboard/_components/overview-stats";
import { StatCard } from "@/components/shared/stat-card";
import type { RoleOverviewData } from "./overview-data";

const UNAVAILABLE = "Could not load this number";

export function WorkloadCards({ data }: { data: RoleOverviewData }) {
  const stats = data.stats;
  return (
    <section aria-labelledby="workload-title" className="space-y-3">
      <h2 id="workload-title" className="text-lg font-semibold text-foreground">
        Workload
      </h2>
      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Only the applications page exists so far; viewings and maintenance show the number without a link. */}
        <LinkedCard href="/owner/applications?status=PENDING">
          <StatCard
            label="Pending applications"
            value={stats ? stats.pendingApplications : "—"}
            icon={FileText}
            hint={stats ? "Waiting for your decision" : UNAVAILABLE}
          />
        </LinkedCard>
        <LinkedCard>
          <StatCard
            label="Pending viewings"
            value={stats ? stats.pendingViewings : "—"}
            icon={CalendarClock}
            hint={stats ? "Viewing requests waiting for an answer" : UNAVAILABLE}
          />
        </LinkedCard>
        <LinkedCard>
          <StatCard
            label="Open maintenance"
            value={stats ? stats.openMaintenance : "—"}
            icon={Wrench}
            hint={stats ? "Requests not resolved or closed yet" : UNAVAILABLE}
          />
        </LinkedCard>
      </div>
    </section>
  );
}
