import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { getApplicationForTenant } from "@/lib/api/applicationServer";
import type { TenantApplication } from "@/types/application";
import { ApplicationDetailView } from "./_components/application-detail-view";

export const metadata: Metadata = {
  title: "Application",
  robots: { index: false },
};

type Loaded = { application: TenantApplication } | { denied: string };

async function load(applicationId: string): Promise<Loaded> {
  try {
    return { application: await getApplicationForTenant(applicationId) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    // The backend 403 message is shown as it comes.
    if (error instanceof ApiError && error.status === 403) {
      return { denied: error.errors[0]?.message || error.message };
    }
    throw error;
  }
}

export default async function TenantApplicationPage({
  params,
}: PageProps<"/dashboard/applications/[applicationId]">) {
  const { applicationId } = await params;
  const result = await load(applicationId);

  if ("denied" in result) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You cannot open this application"
        description={result.denied}
        action={
          <Button asChild>
            <Link href="/dashboard/applications">Back to applications</Link>
          </Button>
        }
      />
    );
  }

  return <ApplicationDetailView application={result.application} />;
}
