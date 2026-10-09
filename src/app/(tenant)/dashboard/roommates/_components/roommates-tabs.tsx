"use client";

import { Handshake, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/useUrlState";
import { MatchesTab } from "./matches-tab";
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
        <div className="rounded-xl border bg-card shadow-sm">
          <EmptyState
            icon={Handshake}
            title="Pairs are coming soon"
            description="Your accepted roommates will be listed here."
          />
        </div>
      </TabsContent>
      <TabsContent value="memberships">
        <div className="rounded-xl border bg-card shadow-sm">
          <EmptyState
            icon={Users}
            title="Memberships are coming soon"
            description="Lease invitations and shared rooms will be listed here."
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
