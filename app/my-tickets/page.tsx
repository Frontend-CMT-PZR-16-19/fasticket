import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, ArrowRight } from "lucide-react";

export default async function MyTicketsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user's bookings with event and organization info
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      event:events(
        *,
        organization:organizations(id, name, slug, logo_url)
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookings:", error);
  }

  const confirmedBookings = bookings?.filter((b) => b.status === "confirmed") || [];
  const cancelledBookings = bookings?.filter((b) => b.status === "cancelled") || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Tickets</h1>
          <p className="text-lg text-muted-foreground">
            View and manage your event bookings
          </p>
        </div>

        {confirmedBookings.length === 0 && cancelledBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                You haven't booked any events yet. Browse events and book your first ticket!
              </p>
              <Link href="/organizations">
                <Button>Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Confirmed Bookings */}
            {confirmedBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Active Tickets ({confirmedBookings.length})
                </h2>
                <div className="grid gap-4">
                  {confirmedBookings.map((booking) => {
                    const event = booking.event;
                    const startDate = new Date(event.start_date);
                    const endDate = new Date(event.end_date);
                    const now = new Date();
                    const isPast = endDate < now;

                    return (
                      <Card key={booking.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* Event Image */}
                            {event.cover_image_url && (
                              <div className="w-full md:w-48 h-32 overflow-hidden rounded-lg flex-shrink-0">
                                <img
                                  src={event.cover_image_url}
                                  alt={event.title}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            )}

                            {/* Event Info */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <Link
                                    href={`/events/${event.slug}`}
                                    className="text-xl font-semibold hover:underline"
                                  >
                                    {event.title}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">
                                    by {event.organization.name}
                                  </p>
                                </div>
                                <Badge variant={isPast ? "outline" : "default"}>
                                  {isPast ? "Past" : "Upcoming"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {startDate.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Booking Code
                                  </p>
                                  <p className="font-mono font-semibold">
                                    {booking.booking_code}
                                  </p>
                                </div>
                                <Link href={`/events/${event.slug}`}>
                                  <Button variant="outline" size="sm">
                                    View Event
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancelled Bookings */}
            {cancelledBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Cancelled Tickets ({cancelledBookings.length})
                </h2>
                <div className="grid gap-4 opacity-60">
                  {cancelledBookings.map((booking) => {
                    const event = booking.event;

                    return (
                      <Card key={booking.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold line-through">
                                {event.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Cancelled on{" "}
                                {new Date(booking.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">Cancelled</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
