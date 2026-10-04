import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section aria-labelledby="cta-heading" className="bg-primary py-12 text-primary-foreground md:py-16 dark:border-y dark:border-border dark:bg-accent dark:text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div className="max-w-xl space-y-2">
          <h2 id="cta-heading" className="text-2xl font-semibold">
            Ready to find your place or list yours?
          </h2>
          <p className="text-base">
            Tenants browse and apply online. Owners list rooms and manage rent, leases and
            maintenance in one place.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary-hover"
          >
            <Link href="/register">List your property</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:border-input dark:bg-transparent dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground"
          >
            <Link href="/rooms">Find a room</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
