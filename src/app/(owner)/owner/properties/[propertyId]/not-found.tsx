import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function PropertyNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Property not found"
      description="It may have been deleted, or it is not one of your properties."
      action={
        <Button asChild>
          <Link href="/owner/properties">Back to properties</Link>
        </Button>
      }
    />
  );
}
