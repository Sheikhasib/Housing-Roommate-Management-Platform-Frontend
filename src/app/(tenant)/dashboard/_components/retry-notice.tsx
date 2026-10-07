"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/shared/error-state";
import { Card } from "@/components/ui/card";

interface RetryNoticeProps {
  title: string;
  message: string;
}

/** A small failure card with a retry that reloads the page data. */
export function RetryNotice({ title, message }: RetryNoticeProps) {
  const router = useRouter();
  return (
    <Card>
      <ErrorState title={title} message={message} onRetry={() => router.refresh()} className="py-6" />
    </Card>
  );
}
