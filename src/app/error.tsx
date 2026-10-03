"use client";

import Link from "next/link";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <ErrorState onRetry={retry} />
      <Button asChild variant="ghost">
        <Link href="/">Go to home</Link>
      </Button>
    </main>
  );
}
