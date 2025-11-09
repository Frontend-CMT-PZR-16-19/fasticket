import { EventsLoadingSkeleton } from '@/components/events/events-loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col">
      {/* Hero Skeleton */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <Skeleton className="h-12 md:h-16 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
          <div className="flex gap-4 justify-center">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </section>

      {/* Featured Events Skeleton */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <EventsLoadingSkeleton />
        </div>
      </section>

      {/* Features Skeleton */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-8 w-48 mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-3">
                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
