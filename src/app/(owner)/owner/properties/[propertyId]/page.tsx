import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { getPropertyForOwnerSide } from "@/lib/api/ownerPropertyServer";
import type { PropertyDetail } from "@/types/property";
import { PropertyDetailView } from "./_components/property-detail-view";

export const metadata: Metadata = {
  title: "Property",
  robots: { index: false },
};

type Loaded = { property: PropertyDetail } | { denied: string };

async function load(propertyId: string): Promise<Loaded> {
  try {
    return { property: await getPropertyForOwnerSide(propertyId) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    // The backend 403 message is shown as it comes.
    if (error instanceof ApiError && error.status === 403) {
      return { denied: error.errors[0]?.message || error.message };
    }
    throw error;
  }
}

export default async function OwnerPropertyPage({
  params,
}: PageProps<"/owner/properties/[propertyId]">) {
  const { propertyId } = await params;
  const result = await load(propertyId);

  if ("denied" in result) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You cannot open this property"
        description={result.denied}
        action={
          <Button asChild>
            <Link href="/owner/properties">Back to properties</Link>
          </Button>
        }
      />
    );
  }

  return <PropertyDetailView property={result.property} />;
}
