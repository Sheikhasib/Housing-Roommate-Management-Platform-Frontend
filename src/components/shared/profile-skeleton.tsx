import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the profile header and one card of fields. */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading profile">
      <Card className="flex-row items-center gap-4 px-4 sm:px-6">
        <Skeleton className="size-16 rounded-full sm:size-20" />
        <div className="w-full max-w-xs space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </Card>
      <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
      <Card className="px-4 sm:px-6">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </Card>
    </div>
  );
}
