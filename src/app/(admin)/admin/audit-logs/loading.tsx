import { Skeleton } from "@/components/ui/skeleton";
import { AuditLogsSkeleton } from "./_components/audit-logs-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <AuditLogsSkeleton />
    </div>
  );
}
