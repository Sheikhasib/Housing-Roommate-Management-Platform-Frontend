import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Link to the notifications page. The unread count is added with spec 12. */
export function NotificationBell() {
  return (
    <Button asChild variant="ghost" size="icon" aria-label="Notifications">
      <Link href="/notifications">
        <Bell className="size-5" aria-hidden />
      </Link>
    </Button>
  );
}
