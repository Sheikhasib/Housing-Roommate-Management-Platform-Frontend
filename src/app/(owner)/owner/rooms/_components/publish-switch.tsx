"use client";

import { Switch } from "@/components/ui/switch";
import { usePublishRoom } from "../_hooks/use-room-queries";

interface PublishSwitchProps {
  roomId: string;
  roomName: string;
  isPublished: boolean;
}

/** Optimistic publish toggle: the cached value changes at once and rolls back on failure. */
export function PublishSwitch({ roomId, roomName, isPublished }: PublishSwitchProps) {
  const mutation = usePublishRoom(roomId);

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isPublished}
        disabled={mutation.isPending}
        onCheckedChange={(next) => mutation.mutate(next)}
        aria-label={`Published: ${roomName}`}
      />
      <span className="text-sm text-muted-foreground">{isPublished ? "Published" : "Draft"}</span>
    </div>
  );
}
