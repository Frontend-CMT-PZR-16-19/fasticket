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

      {error && (
        <div className="text-center py-10">
          <p className="text-destructive">Failed to load events</p>
        </div>
      )}

      {!error && events && events.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No events found</p>
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
