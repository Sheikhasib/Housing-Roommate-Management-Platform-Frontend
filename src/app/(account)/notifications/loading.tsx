import { NotificationsSkeleton } from "./_components/notifications-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <NotificationsSkeleton />
    </div>
  );
}
