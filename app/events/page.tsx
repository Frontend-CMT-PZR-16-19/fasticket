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
    )
    .eq("status", "published");

  // Apply time filters
  const now = new Date().toISOString();
  if (filter === "upcoming") {
    query = query.gt("start_date", now);
  } else if (filter === "ongoing") {
    query = query.lte("start_date", now).gt("end_date", now);
  } else if (filter === "past") {
    query = query.lte("end_date", now);
  }

  // Apply search filter
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  query = query.order("start_date", {
    ascending: filter !== "past",
  });

  const { data: events, error } = await query;

  // Debug: Log filter and results
  console.log("Filter:", filter);
  console.log("Now:", now);
  console.log("Events found:", events?.length || 0);
  if (events && events.length > 0) {
    console.log("First event dates:", {
      start: events[0].start_date,
      end: events[0].end_date,
    });
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Discover Events</h1>
          <p className="text-muted-foreground">
            Find amazing events happening near you
          </p>
        </div>
      </div>

      <EventFilters currentFilter={filter} searchQuery={search} />

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {events && events.length > 0
            ? `Found ${events.length} event${events.length !== 1 ? "s" : ""}`
            : "No events found"}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-destructive">Failed to load events</p>
        </div>
      )}

      {!error && events && events.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg mb-2">No events found</p>
          {filter === "past" && (
            <p className="text-sm text-muted-foreground">
              There are no past events yet. Check back later!
            </p>
          )}
          {filter === "ongoing" && (
            <p className="text-sm text-muted-foreground">
              There are no ongoing events right now.
            </p>
          )}
          {filter === "upcoming" && (
            <p className="text-sm text-muted-foreground">
              No upcoming events at the moment. Check back soon!
            </p>
          )}
          {search && (
            <p className="text-sm text-muted-foreground mt-2">
              Try different search terms
            </p>
          )}
        </div>
      )}

      {!error && events && events.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
