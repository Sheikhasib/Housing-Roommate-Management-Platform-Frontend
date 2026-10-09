import { CalendarDays, MapPin, Wallet } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MatchCardPerson, RoommateMatch } from "@/types/roommate";
import { SendRequestDialog } from "./send-request-dialog";

function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return letters.join("").toUpperCase() || "?";
}

export function PersonAvatar({
  person,
  className,
}: {
  person: Pick<MatchCardPerson, "name" | "imageUrl">;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {person.imageUrl ? <AvatarImage src={person.imageUrl} alt={`Profile picture of ${person.name}`} /> : null}
      <AvatarFallback>{initials(person.name)}</AvatarFallback>
    </Avatar>
  );
}

/** Lifestyle chips; each always carries text, never color alone. */
export function LifestyleChips({ person }: { person: MatchCardPerson }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="neutral">{person.smoker ? "Smoker" : "Non-smoker"}</Badge>
      {person.petFriendly ? <Badge variant="neutral">Pet friendly</Badge> : null}
      {person.hasPets ? <Badge variant="neutral">Has pets</Badge> : null}
    </div>
  );
}

const RING_RADIUS = 20;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Compatibility ring: the number is real text, the arc is decoration. */
function ScoreRing({ score }: { score: number }) {
  const value = Math.min(100, Math.max(0, Math.round(score)));
  return (
    <div
      className="relative size-14 shrink-0"
      role="img"
      aria-label={`Compatibility score ${value} out of 100`}
    >
      <svg viewBox="0 0 48 48" className="size-14 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={RING_RADIUS} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="24"
          cy="24"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - value / 100)}
          className="stroke-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

function MetaRow({ icon: Icon, children, muted }: { icon: typeof MapPin; children: React.ReactNode; muted?: boolean }) {
  return (
    <p className={cn("flex items-center gap-2 text-sm", muted ? "text-muted-foreground" : "text-foreground")}>
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </p>
  );
}

interface MatchCardProps {
  match: RoommateMatch;
  alreadySent: boolean;
  onSent: (matchId: string) => void;
}

export function MatchCard({ match, alreadySent, onSent }: MatchCardProps) {
  return (
    <Card className="h-full gap-4 px-5 py-5 transition-shadow duration-150 hover:shadow-md">
      <div className="flex items-start gap-3">
        <PersonAvatar person={match} className="size-12" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">{match.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{match.occupation || "Occupation not set"}</p>
        </div>
        <ScoreRing score={match.score} />
      </div>

      <div className="space-y-1.5">
        <MetaRow icon={MapPin} muted={!match.preferredCity}>
          {match.preferredCity || "City not set"}
        </MetaRow>
        <MetaRow icon={Wallet} muted={match.monthlyBudgetMax === null}>
          {match.monthlyBudgetMax === null ? "Budget not set" : `Up to ${formatMoney(match.monthlyBudgetMax)} / month`}
        </MetaRow>
        <MetaRow icon={CalendarDays} muted={!match.moveInDate}>
          {match.moveInDate ? `Move in ${formatDate(match.moveInDate)}` : "Move-in date not set"}
        </MetaRow>
      </div>

      <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{match.bio || "No bio yet."}</p>

      <LifestyleChips person={match} />

      <div className="mt-auto pt-1">
        <SendRequestDialog
          receiverId={match.id}
          receiverName={match.name}
          alreadySent={alreadySent}
          onSent={() => onSent(match.id)}
        />
      </div>
    </Card>
  );
}
