import { HomeSection } from "./home-section";

const STEPS = [
  {
    title: "Browse",
    description: "Search published rooms by city, room type and rent.",
  },
  {
    title: "Visit",
    description: "Request a viewing for a date and time slot that suits you.",
  },
  {
    title: "Apply and pay the deposit",
    description: "Apply to the room. Once approved, pay the booking deposit online.",
  },
  {
    title: "Move in",
    description: "Your lease is created as soon as the deposit is confirmed.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <HomeSection
      title="How it works"
      description="From the first search to your keys, in four steps."
      tone="background"
    >
      <ol className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
            >
              {index + 1}
            </span>
            <h3 className="text-base font-semibold text-foreground">
              <span className="sr-only">Step {index + 1}: </span>
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}
