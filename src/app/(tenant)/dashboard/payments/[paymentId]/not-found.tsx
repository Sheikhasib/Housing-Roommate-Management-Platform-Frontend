import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function PaymentNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Payment not found"
      description="It may have been removed, or it is not one of your payments."
      action={
        <Button asChild>
          <Link href="/dashboard/payments">Back to payments</Link>
        </Button>
      }
    />
  );
}
