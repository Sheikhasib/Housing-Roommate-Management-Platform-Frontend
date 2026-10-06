import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { PropertiesList } from "./_components/properties-list";
import { PropertiesSkeleton } from "./_components/properties-skeleton";

export const metadata: Metadata = {
  title: "Properties",
  robots: { index: false },
};

export default function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Properties" description="Every listed property with its owner and rooms. Remove a listing that breaks the rules." />
      <Suspense fallback={<PropertiesSkeleton />}>
        <PropertiesList />
      </Suspense>
    </div>
  );
}
