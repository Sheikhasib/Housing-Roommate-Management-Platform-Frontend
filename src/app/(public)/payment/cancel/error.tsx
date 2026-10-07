"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function PaymentReturnError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      error={error}
      title="We could not check your payment"
      message="Your payment was not changed. Try again to see its latest status."
      onRetry={retry}
      className="py-24"
    />
  );
}
