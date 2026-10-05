"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Raises one toast per failed overview call; renders nothing. */
export function OverviewErrorToast({ messages }: { messages: string[] }) {
  const key = messages.join("|");

  useEffect(() => {
    if (!key) return;
    for (const message of key.split("|")) toast.error(message);
  }, [key]);

  return null;
}
