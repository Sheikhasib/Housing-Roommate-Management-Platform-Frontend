import { RetryNotice } from "@/app/(tenant)/dashboard/_components/retry-notice";
import type { OverviewData } from "./overview-data";
import { MoreNumbers } from "./more-numbers";
import { OverviewEmpty } from "./overview-empty";
import { OverviewStats } from "./overview-stats";
import { OwnerCharts } from "./owner-charts";
import { WorkloadCards } from "./workload-cards";

export function OwnerOverview({ data }: { data: OverviewData }) {
  if (data.kind === "unknown") {
    return <RetryNotice title="Could not load your overview" message={data.errorMessage} />;
  }

  const propertyCount = data.stats
    ? data.kind === "owner"
      ? data.stats.totalProperties
      : data.stats.managedProperties
    : null;
  if (propertyCount === 0) return <OverviewEmpty kind={data.kind} />;

  return (
    <>
      {data.errorMessage ? <RetryNotice title="Could not load your numbers" message={data.errorMessage} /> : null}
      <OverviewStats data={data} />
      <WorkloadCards data={data} />
      <MoreNumbers data={data} />
      <OwnerCharts data={data} />
    </>
  );
}
