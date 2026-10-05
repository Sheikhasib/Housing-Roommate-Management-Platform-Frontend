import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <div
      className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 md:py-16 lg:px-8"
      aria-busy="true"
      aria-label="Loading contact page"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-8 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
