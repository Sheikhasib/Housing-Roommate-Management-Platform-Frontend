import { Skeleton } from "@/components/ui/skeleton";
import { PaymentsSkeleton } from "./_components/payments-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <PaymentsSkeleton />
    </div>
  );
}
