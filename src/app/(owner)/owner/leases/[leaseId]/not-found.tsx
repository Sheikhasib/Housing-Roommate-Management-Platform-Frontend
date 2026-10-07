import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function OwnerLeaseNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Lease not found"
      description="It may have been removed, or it is not a lease for your rooms."
      action={
        <Button asChild>
          <Link href="/owner/leases">Back to leases</Link>
        </Button>
      }
    />
  );
}
