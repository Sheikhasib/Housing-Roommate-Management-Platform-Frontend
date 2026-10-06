"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Can } from "@/components/shared/can";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/hooks/useRole";
import { useUrlState } from "@/hooks/useUrlState";
import { hasPermission } from "@/lib/permissions";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import type { PropertyDetail } from "@/types/property";
import { useProperty } from "../../_hooks/use-property-queries";
import { DeleteProperty } from "./delete-property";
import { PropertyImages } from "./property-images";
import { PropertyManagers } from "./property-managers";
import { PropertyOverviewForm } from "./property-overview-form";
import { PropertyUnits } from "./property-units";

const TABS = ["overview", "images", "units", "managers"] as const;
type TabValue = (typeof TABS)[number];

function isTab(value: string): value is TabValue {
  return (TABS as readonly string[]).includes(value);
}

export function PropertyDetailView({ property: initial }: { property: PropertyDetail }) {
  const { data: property } = useProperty(initial.id, initial);
  const { getParam, setParams } = useUrlState();
  const { role } = useRole();
  const requested = getParam("tab");
  // The Units tab is owner only: a manager who opens ?tab=units lands on Overview.
  const tab: TabValue =
    isTab(requested) && (requested !== "units" || hasPermission(role, "units.manage"))
      ? requested
      : "overview";

  return (
    <div className="space-y-6">
      <Link
        href="/owner/properties"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All properties
      </Link>

      <PageHeader
        title={property.title}
        description={[property.area, property.city].filter(Boolean).join(", ")}
        action={
          <>
            <Badge variant="info">{PROPERTY_TYPE_LABELS[property.type]}</Badge>
            <Can permission="properties.createDelete">
              <DeleteProperty propertyId={property.id} title={property.title} />
            </Can>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value })}>
        <TabsList className="h-auto w-full justify-start sm:w-fit">
          <TabsTrigger value="overview" className="min-h-10 px-4">
            Overview
          </TabsTrigger>
          <TabsTrigger value="images" className="min-h-10 px-4">
            Images
          </TabsTrigger>
          <Can permission="units.manage">
            <TabsTrigger value="units" className="min-h-10 px-4">
              Units
            </TabsTrigger>
          </Can>
          <TabsTrigger value="managers" className="min-h-10 px-4">
            Managers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <PropertyOverviewForm property={property} />
        </TabsContent>
        <TabsContent value="images" className="pt-4">
          <PropertyImages property={property} />
        </TabsContent>
        <Can permission="units.manage">
          <TabsContent value="units" className="pt-4">
            <PropertyUnits property={property} />
          </TabsContent>
        </Can>
        <TabsContent value="managers" className="pt-4">
          <PropertyManagers propertyId={property.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
