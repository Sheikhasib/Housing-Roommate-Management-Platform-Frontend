import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteNavbar } from "@/components/shared/site-navbar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteNavbar />
      <main id="main" className="flex flex-1 items-center justify-center py-16">
        <EmptyState
          icon={FileQuestion}
          title="Page not found"
          description="The page you are looking for does not exist or has moved."
          action={
            <Button asChild>
              <Link href="/">Go to home</Link>
            </Button>
          }
        />
      </main>
      <SiteFooter />
    </>
  );
}
