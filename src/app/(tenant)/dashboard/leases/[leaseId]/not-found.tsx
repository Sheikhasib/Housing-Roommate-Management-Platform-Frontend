import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function LeaseNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Lease not found"
      description="It may have been removed, or it is not one of your leases."
      action={
        <Button asChild>
          <Link href="/dashboard/leases">Back to leases</Link>
        </Button>
      }
    />
  );
}
