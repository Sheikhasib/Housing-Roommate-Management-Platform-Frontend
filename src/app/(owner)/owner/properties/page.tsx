import type { Metadata } from "next";
import { Suspense } from "react";

import { PropertiesList } from "./_components/properties-list";
import { PropertiesSkeleton } from "./_components/properties-skeleton";

export const metadata: Metadata = {
  title: "Properties",
  robots: { index: false },
};

export default function OwnerPropertiesPage() {
  return (
    <Suspense fallback={<PropertiesSkeleton />}>
      <PropertiesList />
    </Suspense>
  );
}
