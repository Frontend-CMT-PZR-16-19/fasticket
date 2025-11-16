import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";

interface PageProps {
  searchParams: Promise<{
    filter?: "upcoming" | "ongoing" | "past";
    search?: string;
  }>;
}

export const metadata = {
  title: "Discover Events - Fasticket",
  description: "Find amazing events happening near you",
};

export default async function EventsPage({ searchParams }: PageProps) {
  const { filter = "upcoming", search = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select(
      `
      *,
      organization:organizations(id, name, slug, logo_url)
    `
    );
    // Don't filter by status initially to see all events
    // .eq("status", "published");

  // Apply time filters
  const now = new Date().toISOString();
  
  console.log("=== DEBUG INFO ===");
  console.log("Filter:", filter);
  console.log("Current time:", now);
  
  if (filter === "upcoming") {
    query = query.gt("start_date", now);
  } else if (filter === "ongoing") {
    query = query.lte("start_date", now).gt("end_date", now);
  } else if (filter === "past") {
    query = query.lt("end_date", now);
  }

  // Apply search filter
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  query = query.order("start_date", {
    ascending: filter !== "past",
  });

  const { data: events, error } = await query;

  // Enhanced debug logging
  console.log("Error:", error);
  console.log("Events found:", events?.length || 0);
  if (events && events.length > 0) {
    console.log("First 3 events:", events.slice(0, 3).map(e => ({
      title: e.title,
      status: e.status,
      start_date: e.start_date,
      end_date: e.end_date,
      isPast: new Date(e.end_date) < new Date(),
      isUpcoming: new Date(e.start_date) > new Date(),
    })));
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold">Discover Events</h1>
            <p className="text-muted-foreground text-lg">
              Find amazing events happening near you
            </p>
          </div>
        </div>

        {/* Filters */}
        <EventFilters currentFilter={filter} searchQuery={search} />

        {/* Results Count */}
        <div className="mb-6 mt-8">
          <p className="text-sm text-muted-foreground">
            {events && events.length > 0
              ? `Found ${events.length} event${events.length !== 1 ? "s" : ""}`
              : "No events found"}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive text-lg">Failed to load events</p>
          </div>
        )}

        {/* Empty State */}
        {!error && events && events.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-6 bg-muted/50 rounded-full mb-6">
              <svg className="h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-2">No events found</h3>
            {filter === "past" && (
              <p className="text-muted-foreground">
                There are no past events yet. Check back later!
              </p>
            )}
            {filter === "ongoing" && (
              <p className="text-muted-foreground">
                There are no ongoing events right now.
              </p>
            )}
            {filter === "upcoming" && (
              <p className="text-muted-foreground">
                No upcoming events at the moment. Check back soon!
              </p>
            )}
            {search && (
              <p className="text-muted-foreground mt-2">
                Try different search terms
              </p>
            )}
          </div>
        )}

        {/* Events Grid */}
        {!error && events && events.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
