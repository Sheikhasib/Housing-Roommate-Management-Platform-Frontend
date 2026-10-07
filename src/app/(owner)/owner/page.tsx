import type { Metadata } from "next";
import { cookies } from "next/headers";

import { OverviewErrorToast } from "@/app/(admin)/admin/_components/overview-error-toast";
import { PageHeader } from "@/components/shared/page-header";
import { getManagerAnalytics, getOwnerAnalytics } from "@/lib/api/ownerOverview";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { OverviewData } from "./_components/overview-data";
import { OwnerOverview } from "./_components/owner-overview";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false },
};

const UNKNOWN_ROLE_MESSAGE = "We could not tell which account you are using. Try again.";

async function loadOverview(): Promise<OverviewData> {
  // Only the role is read from the token, and only on the server.
  const session = await verifyAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);

  if (session?.role === "OWNER") {
    const result = await getOwnerAnalytics();
    return result.ok
      ? { kind: "owner", stats: result.data }
      : { kind: "owner", stats: null, errorMessage: result.message };
  }
  if (session?.role === "PROPERTY_MANAGER") {
    const result = await getManagerAnalytics();
    return result.ok
      ? { kind: "manager", stats: result.data }
      : { kind: "manager", stats: null, errorMessage: result.message };
  }
  return { kind: "unknown", stats: null, errorMessage: UNKNOWN_ROLE_MESSAGE };
}

export default async function OwnerOverviewPage() {
  const data = await loadOverview();
  const isManager = data.kind === "manager";

  return (
    <div className="space-y-6">
      <OverviewErrorToast messages={data.errorMessage ? [data.errorMessage] : []} />
      <PageHeader
        title="Overview"
        description={
          isManager
            ? "Occupancy and workload across the properties assigned to you."
            : "Occupancy, workload and earnings across your properties."
        }
      />
      <OwnerOverview data={data} />
    </div>
  );
}
