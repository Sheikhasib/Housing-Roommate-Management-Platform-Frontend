"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/useUrlState";
import { AllPayments } from "./all-payments";
import { PendingRefunds } from "./pending-refunds";

const TABS = ["all", "refunds"] as const;
type PaymentsTab = (typeof TABS)[number];

function isTab(value: string): value is PaymentsTab {
  return (TABS as readonly string[]).includes(value);
}

export function PaymentsTabs() {
  const { getParam, setParams } = useUrlState();
  const raw = getParam("tab");
  const tab: PaymentsTab = isTab(raw) ? raw : "all";

  // Each tab has its own filters, so leaving one clears the others.
  const changeTab = (next: string) => setParams({ tab: next, status: null, purpose: null, limit: null });

  return (
    <Tabs value={tab} onValueChange={changeTab} className="gap-4">
      <TabsList className="h-10 w-full sm:w-fit">
        <TabsTrigger value="all" className="min-h-9 flex-1 px-4 sm:flex-none">
          All payments
        </TabsTrigger>
        <TabsTrigger value="refunds" className="min-h-9 flex-1 px-4 sm:flex-none">
          Pending refunds
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <AllPayments />
      </TabsContent>
      <TabsContent value="refunds">
        <PendingRefunds />
      </TabsContent>
    </Tabs>
  );
}
