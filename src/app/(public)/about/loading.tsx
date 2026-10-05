import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeSectionSkeleton } from "../_components/home-section";
import { StatsStripSkeleton } from "../_components/stats-strip";

function CardsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="rounded-xl shadow-sm">
          <CardContent className="space-y-3">
            <Skeleton className="size-11 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AboutLoading() {
  return (
    <div aria-busy="true" aria-label="Loading about page">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </div>
      <HomeSectionSkeleton tone="background">
        <CardsSkeleton count={3} />
      </HomeSectionSkeleton>
      <HomeSectionSkeleton tone="card">
        <CardsSkeleton count={2} />
      </HomeSectionSkeleton>
      <StatsStripSkeleton />
    </div>
  );
}
