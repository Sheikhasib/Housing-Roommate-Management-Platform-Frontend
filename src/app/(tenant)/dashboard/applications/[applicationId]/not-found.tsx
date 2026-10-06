import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function ApplicationNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Application not found"
      description="It may have been removed, or it is not one of your applications."
      action={
        <Button asChild>
          <Link href="/dashboard/applications">Back to applications</Link>
        </Button>
      }
    />
  );
}
