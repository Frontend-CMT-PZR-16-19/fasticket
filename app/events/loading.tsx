import { EventsLoadingSkeleton } from '@/components/events/events-loading-skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <EventsLoadingSkeleton />
    </div>
  );
}
