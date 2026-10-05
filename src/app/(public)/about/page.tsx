import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2, ClipboardList, CreditCard, ShieldCheck, UserRound, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { HomeSection } from "../_components/home-section";
import { StatsStripSkeleton } from "../_components/stats-strip";
import { AboutStats } from "./_components/about-stats";

const DESCRIPTION = `${APP_NAME} brings tenants, owners and property managers together: verified accounts, secure online payments and roommate matching.`;

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
};

interface InfoCard {
  icon: LucideIcon;
  title: string;
  body: string;
}

const AUDIENCES: readonly InfoCard[] = [
  {
    icon: UserRound,
    title: "Tenants",
    body: "Browse published rooms, request a viewing, apply, pay the booking deposit online and then manage your lease, rent invoices and maintenance requests in one place.",
  },
  {
    icon: Building2,
    title: "Owners",
    body: "List your properties and rooms once an admin has approved your account. Review viewing requests and applications, and follow leases, invoices and payments.",
  },
  {
    icon: ClipboardList,
    title: "Property managers",
    body: "Handle viewings, applications and maintenance for the properties an owner assigns to you. Lease access is view-only, and money actions stay with the owner.",
  },
];

const TRUST: readonly InfoCard[] = [
  {
    icon: ShieldCheck,
    title: "Verification",
    body: "Tenants upload an identity document and owners upload identity documents. An admin approves or rejects each one. Only approved tenants can pay, and only approved owners can manage properties and rooms.",
  },
  {
    icon: CreditCard,
    title: "Secure payments",
    body: "You pay through bKash, SSLCommerz or Stripe, and you only see the gateways that are enabled. Card data is handled by the gateway, and a payment counts as paid only after the gateway confirms it.",
  },
];

function InfoGrid({ cards, columns }: { cards: readonly InfoCard[]; columns: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", columns)}>
      {cards.map(({ icon: Icon, title, body }) => (
        <Card key={title} className="h-full rounded-xl shadow-sm">
          <CardContent className="space-y-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-base text-muted-foreground">{body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <h1 className="text-3xl font-semibold text-foreground">About {APP_NAME}</h1>
          <p className="max-w-3xl text-base text-muted-foreground">{APP_DESCRIPTION}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/rooms" className={cn(buttonVariants(), "h-10")}>
              Find a room
            </Link>
            <Link href="/help" className={cn(buttonVariants({ variant: "outline" }), "h-10")}>
              Read the help centre
            </Link>
          </div>
        </div>
      </header>

      <HomeSection
        title="Who it is for"
        description={`${APP_NAME} serves the three people involved in renting a home.`}
        tone="background"
      >
        <InfoGrid cards={AUDIENCES} columns="md:grid-cols-3" />
      </HomeSection>

      <HomeSection
        title="Verification and secure payments"
        description="Trust is built into the steps that matter most."
        tone="card"
      >
        <InfoGrid cards={TRUST} columns="md:grid-cols-2" />
      </HomeSection>

      <Suspense fallback={<StatsStripSkeleton />}>
        <AboutStats />
      </Suspense>

      <HomeSection
        title="Roommate matching"
        description="Find someone who fits how you live."
        tone="background"
      >
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div className="max-w-3xl space-y-2">
              <p className="text-base text-muted-foreground">
                Tenants who are looking for a roommate get a ranked list of other tenants. Each one has a
                compatibility score from 0 to 100, based on preferred city, budget, smoking, pets and
                move-in date.
              </p>
              <p className="text-base text-muted-foreground">
                You send a roommate request and the other tenant accepts or declines it. Contact details are
                not shown to the other tenant before then.
              </p>
            </div>
          </CardContent>
        </Card>
      </HomeSection>
    </>
  );
}
