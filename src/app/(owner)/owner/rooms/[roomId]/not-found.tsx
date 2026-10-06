import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function RoomNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Room not found"
      description="It may have been deleted, or it is not one of your rooms."
      action={
        <Button asChild>
          <Link href="/owner/rooms">Back to rooms</Link>
        </Button>
      }
    />
  );
}
