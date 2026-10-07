"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function PaymentsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState error={error} onRetry={retry} className="py-24" />;
}
