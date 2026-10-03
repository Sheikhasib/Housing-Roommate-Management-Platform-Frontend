import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function RoomNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <EmptyState
        icon={SearchX}
        title="This room is not available"
        description="It may have been unpublished or removed. Browse the rooms that are open right now."
        action={
          <Button asChild>
            <Link href="/rooms">Browse rooms</Link>
          </Button>
        }
      />
    </div>
  );
}
