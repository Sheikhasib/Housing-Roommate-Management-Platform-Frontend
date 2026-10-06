import { Skeleton } from "@/components/ui/skeleton";
import { VerificationsSkeleton } from "./_components/verifications-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <VerificationsSkeleton />
    </div>
  );
}
