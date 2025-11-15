import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, MapPin, Ticket } from "lucide-react";

export default async function EventsPage() {
  const supabase = await createClient();

  // Fetch all published events
  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organization:organizations(id, name, slug, logo_url)
    `
    )
    .eq("status", "published")
    .gte("end_date", new Date().toISOString())
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
        <p className="text-muted-foreground">
          Discover and book tickets for exciting events
        </p>
      </div>

      {!events || events.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for new events or create your own organization to
              start hosting!
            </p>
            <Link href="/organizations/create">
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90">
                Create Organization
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => {
            const startDate = new Date(event.start_date);
            const organization = event.organization;

            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {event.cover_image_url && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {event.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {startDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ticket className="h-4 w-4" />
                      <span>
                        {event.is_free
                          ? "Free"
                          : `$${event.ticket_price.toFixed(2)}`}
                      </span>
                    </div>
                    {organization && (
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        by {organization.name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
