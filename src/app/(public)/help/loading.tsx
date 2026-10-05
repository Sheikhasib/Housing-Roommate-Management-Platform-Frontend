import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HelpLoading() {
  return (
    <div
      className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 md:py-16 lg:px-8"
      aria-busy="true"
      aria-label="Loading help centre"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-xl border border-border bg-card px-4 shadow-sm sm:px-6">
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="flex min-h-12 items-center py-3">
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="hidden h-10 w-28 rounded-lg sm:block" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
