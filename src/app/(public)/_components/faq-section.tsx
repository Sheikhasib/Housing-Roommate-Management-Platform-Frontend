import Link from "next/link";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_ITEMS, HOME_FAQ_COUNT } from "@/lib/faq";
import { HomeSection } from "./home-section";

export function FaqSection() {
  const items = FAQ_ITEMS.slice(0, HOME_FAQ_COUNT);

  return (
    <HomeSection
      title="Frequently asked questions"
      description="Quick answers about verification, viewings, applications and payments."
      tone="background"
      viewAll={{ href: "/help", label: "See all questions" }}
    >
      <Accordion
        type="single"
        collapsible
        className="mx-auto max-w-3xl rounded-xl border border-border bg-card px-4 shadow-sm sm:px-6"
      >
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="min-h-12 items-center py-3 text-base font-semibold">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-base text-muted-foreground">
              <p>{item.answer}</p>
              {item.link ? (
                <Link href={item.link.href} className="font-medium text-primary">
                  {item.link.label}
                </Link>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </HomeSection>
  );
}
