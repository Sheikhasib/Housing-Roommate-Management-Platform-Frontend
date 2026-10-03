"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function OwnerError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState onRetry={retry} className="py-24" />;
}
