import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function MembershipNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Membership not found"
      description="It may not exist, or it is not one of your memberships."
      action={
        <Button asChild>
          <Link href="/dashboard/roommates?tab=memberships">Back to memberships</Link>
        </Button>
      }
    />
  );
}
