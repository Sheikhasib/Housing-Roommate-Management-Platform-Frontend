"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/useUrlState";
import { MatchesTab } from "./matches-tab";
import { MembershipsTab } from "./memberships-tab";
import { PairsTab } from "./pairs-tab";
import { RequestsTab } from "./requests-tab";

const TABS = ["matches", "requests", "pairs", "memberships"] as const;
type RoommatesTab = (typeof TABS)[number];

function isTab(value: string): value is RoommatesTab {
  return (TABS as readonly string[]).includes(value);
}

export function RoommatesTabs() {
  const { getParam, setParams } = useUrlState();
  const raw = getParam("tab");
  const tab: RoommatesTab = isTab(raw) ? raw : "matches";

  // Each tab has its own filters, so leaving one clears the others.
  const changeTab = (next: string) => setParams({ tab: next, status: null, limit: null });

  return (
    <Tabs value={tab} onValueChange={changeTab} className="gap-4">
      <TabsList className="h-10 w-full sm:w-fit">
        <TabsTrigger value="matches" className="min-h-9 flex-1 px-4 sm:flex-none">
          Matches
        </TabsTrigger>
        <TabsTrigger value="requests" className="min-h-9 flex-1 px-4 sm:flex-none">
          Requests
        </TabsTrigger>
        <TabsTrigger value="pairs" className="min-h-9 flex-1 px-4 sm:flex-none">
          Pairs
        </TabsTrigger>
        <TabsTrigger value="memberships" className="min-h-9 flex-1 px-4 sm:flex-none">
          Memberships
        </TabsTrigger>
      </TabsList>
      <TabsContent value="matches">
        <MatchesTab />
      </TabsContent>
      <TabsContent value="requests">
        <RequestsTab />
      </TabsContent>
      <TabsContent value="pairs">
        <PairsTab />
      </TabsContent>
      <TabsContent value="memberships">
        <MembershipsTab />
      </TabsContent>
    </Tabs>
  );
}
