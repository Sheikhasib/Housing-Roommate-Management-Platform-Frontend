"use client";

import { useState } from "react";
import Link from "next/link";
import { UserRoundSearch, UserRoundX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { useTenantProfile } from "@/hooks/useProfile";
import { MatchCard } from "./match-card";
import { MatchesSkeleton } from "./roommates-skeleton";
import { useRoommateMatches } from "../_hooks/use-roommate-queries";

const PREFERENCES_HREF = "/dashboard/profile?tab=preferences";

export function MatchesTab() {
  const profile = useTenantProfile(true);
  const matchingOn = profile.data?.lookingForRoommate === true;
  const matches = useRoommateMatches(matchingOn);
  // The server keeps the list for up to 5 minutes, so a card stays until then. Remember who got a request.
  const [sentIds, setSentIds] = useState<ReadonlySet<string>>(new Set());

  if (profile.isPending) return <MatchesSkeleton />;
  if (profile.isError || !profile.data) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      </div>
    );
  }

  if (!matchingOn) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <EmptyState
          icon={UserRoundX}
          title="Roommate matching is off"
          description="Matching is off because you have not said you are looking for a roommate. Turn on “Looking for a roommate” in your profile preferences to see ranked matches and let others find you."
          action={
            <Button asChild>
              <Link href={PREFERENCES_HREF}>Open profile preferences</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (matches.isPending) return <MatchesSkeleton />;
  if (matches.isError || !matches.data) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
      </div>
    );
  }

  if (matches.data.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <EmptyState
          icon={UserRoundSearch}
          title="No matches yet"
          description="No other tenants who are looking for a roommate fit right now. Add your city, budget and move-in date to your preferences, then check again later."
          action={
            <Button asChild variant="outline">
              <Link href={PREFERENCES_HREF}>Review preferences</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {matches.data.length} {matches.data.length === 1 ? "match" : "matches"}, best fit first. The list can be up
        to 5 minutes old.
      </p>
      <ul className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.data.map((match) => (
          <li key={match.id} className="h-full">
            <MatchCard
              match={match}
              alreadySent={sentIds.has(match.id)}
              onSent={(id) => setSentIds((current) => new Set(current).add(id))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
