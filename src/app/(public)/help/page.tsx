import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { FAQ_ITEMS } from "@/lib/faq";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Help centre",
  description: `Answers about verification, viewings, applications, payments and roommate matching on ${APP_NAME}.`,
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <PageHeader
        title="Help centre"
        description="Quick answers about verification, viewings, applications, payments and roommate matching."
      />

      <div className="mx-auto max-w-3xl space-y-8">
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-4 shadow-sm sm:px-6">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="min-h-12 items-center py-3 text-base font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-4 text-base text-muted-foreground">
                <p>{item.answer}</p>
                {item.link ? (
                  <Link href={item.link.href} className="font-medium text-primary hover:underline">
                    {item.link.label}
                  </Link>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <MessageSquare className="size-5" aria-hidden />
            </span>
            <div className="flex-1 space-y-1">
              <h2 className="text-base font-semibold text-foreground">Still need help?</h2>
              <p className="text-sm text-muted-foreground">Send us a message and we will reply by email.</p>
            </div>
            <Link href="/contact" className={cn(buttonVariants(), "h-10 shrink-0")}>
              Contact us
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
