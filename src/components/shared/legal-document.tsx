import { Skeleton } from "@/components/ui/skeleton";
import { CONTACT } from "@/lib/constants";
import { LEGAL_LAST_UPDATED, type LegalSection } from "@/lib/legal";

interface LegalDocumentProps {
  title: string;
  description: string;
  sections: readonly LegalSection[];
}

const LAST_UPDATED_LABEL = new Date(`${LEGAL_LAST_UPDATED}T00:00:00Z`).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function ContactDetails() {
  return (
    <ul className="space-y-1 text-base text-muted-foreground">
      <li>
        Email:{" "}
        <a href={`mailto:${CONTACT.email}`} className="font-medium text-primary hover:underline">
          {CONTACT.email}
        </a>
      </li>
      <li>Address: {CONTACT.address}</li>
      <li>Hours: {CONTACT.hours}</li>
    </ul>
  );
}

export function LegalDocument({ title, description, sections }: LegalDocumentProps) {
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          <p className="max-w-3xl text-base text-muted-foreground">{description}</p>
          <p className="text-sm text-muted-foreground">
            Last updated: <time dateTime={LEGAL_LAST_UPDATED}>{LAST_UPDATED_LABEL}</time>
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 lg:px-8">
        <nav
          aria-label={`${title} sections`}
          className="h-fit rounded-xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24"
        >
          <p className="mb-2 text-sm font-semibold text-foreground">On this page</p>
          <ol className="space-y-1">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex min-h-10 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl space-y-10">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-24 space-y-3">
              <h2 id={`${section.id}-heading`} className="text-xl font-semibold text-foreground">
                {index + 1}. {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-base leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-muted-foreground marker:text-primary">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.showContact ? <ContactDetails /> : null}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

export function LegalDocumentSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label}>
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 lg:px-8">
        <Skeleton className="h-64 rounded-xl" />
        <div className="max-w-3xl space-y-8">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
