import { CreditCard, ShieldCheck, Users, Wrench } from "lucide-react";

import { HomeSection } from "./home-section";

const REASONS = [
  {
    icon: ShieldCheck,
    title: "Verified owners and tenants",
    description:
      "An admin reviews identity documents. Only approved owners list properties and only approved tenants pay.",
  },
  {
    icon: CreditCard,
    title: "Secure payments",
    description:
      "Pay with bKash, SSLCommerz or Stripe. A payment counts as paid only after the gateway confirms it.",
  },
  {
    icon: Users,
    title: "Roommate matching",
    description:
      "Tenants looking for a roommate get a ranked list of matches based on city, budget, lifestyle and move-in date.",
  },
  {
    icon: Wrench,
    title: "Maintenance requests",
    description: "Tenants raise maintenance requests in the app and follow them until they are resolved.",
  },
] as const;

export function WhyChooseUsSection() {
  return (
    <HomeSection
      title="Why choose us"
      description="What the platform does for tenants and owners."
      tone="card"
    >
      <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map(({ icon: Icon, title, description }) => (
          <li
            key={title}
            className="flex h-full flex-col gap-3 rounded-xl border border-border bg-background p-5 shadow-sm"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
