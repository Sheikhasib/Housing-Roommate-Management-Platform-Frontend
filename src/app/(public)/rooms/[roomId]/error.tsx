"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";

export default function RoomDetailError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    toast.error("We could not load this room. Try again.");
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ErrorState
        title="We could not load this room"
        message="The room is not available right now. Check your connection and try again."
        onRetry={retry}
      />
    </div>
  );
}
