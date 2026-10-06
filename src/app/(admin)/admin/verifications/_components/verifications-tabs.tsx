"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/useUrlState";
import { OwnerVerifications } from "./owner-verifications";
import { TenantVerifications } from "./tenant-verifications";

const TABS = ["owners", "tenants"] as const;
type VerificationTab = (typeof TABS)[number];

function isTab(value: string): value is VerificationTab {
  return (TABS as readonly string[]).includes(value);
}

export function VerificationsTabs() {
  const { getParam, setParams } = useUrlState();
  const raw = getParam("tab");
  const tab: VerificationTab = isTab(raw) ? raw : "owners";

  // Each tab has its own filters, so leaving one clears the others.
  const changeTab = (next: string) =>
    setParams({ tab: next, searchTerm: null, verificationStatus: null, limit: null });

  return (
    <Tabs value={tab} onValueChange={changeTab} className="gap-4">
      <TabsList className="h-10 w-full sm:w-fit">
        <TabsTrigger value="owners" className="min-h-9 flex-1 px-4 sm:flex-none">
          Owners
        </TabsTrigger>
        <TabsTrigger value="tenants" className="min-h-9 flex-1 px-4 sm:flex-none">
          Tenants
        </TabsTrigger>
      </TabsList>
      <TabsContent value="owners">
        <OwnerVerifications />
      </TabsContent>
      <TabsContent value="tenants">
        <TenantVerifications />
      </TabsContent>
    </Tabs>
  );
}
