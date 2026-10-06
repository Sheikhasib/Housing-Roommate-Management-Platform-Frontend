import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesSkeleton } from "./_components/properties-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <PropertiesSkeleton />
    </div>
  );
}
