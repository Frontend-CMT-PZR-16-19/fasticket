import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import Link from "next/link";
import { Calendar, MapPin, Ticket, Building2 } from "lucide-react";
import type { Booking, Event, Organization } from "@/types/database";

export const metadata = {
  title: "My Bookings - Fasticket",
  description: "View and manage your event bookings",
};

type BookingWithDetails = Booking & {
  event: Event & {
    organization: Organization;
  };
};

export default async function MyBookingsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get all bookings for this user
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      *,
      event:events(
        *,
        organization:organizations(*)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookings:", error);
  }

  const allBookings = (bookings || []) as BookingWithDetails[];
  const now = new Date();

  // Categorize bookings
  const upcomingBookings = allBookings.filter(
    (b) => b.status === "confirmed" && new Date(b.event.start_date) > now
  );
  const pastBookings = allBookings.filter(
    (b) => b.status === "confirmed" && new Date(b.event.end_date) <= now
  );
  const cancelledBookings = allBookings.filter((b) => b.status === "cancelled");

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage your event bookings
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingBookings.length === 0 ? (
            <EmptyState message="No upcoming bookings" />
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length === 0 ? (
            <EmptyState message="No past bookings" />
          ) : (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {cancelledBookings.length === 0 ? (
            <EmptyState message="No cancelled bookings" />
          ) : (
            <div className="space-y-4">
              {cancelledBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingWithDetails }) {
  const event = booking.event;
  const startDate = new Date(event.start_date);
  const isCancelled = booking.status === "cancelled";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
            <Link
              href={`/organizations/${event.organization.slug}`}
              className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
            >
              <Building2 className="h-4 w-4" />
              {event.organization.name}
            </Link>
          </div>
          <Badge variant={isCancelled ? "destructive" : "default"}>
            {isCancelled ? "Cancelled" : "Confirmed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Date */}
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-sm font-medium">
                {startDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {startDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                {event.venue_name && (
                  <p className="text-sm font-medium">{event.venue_name}</p>
                )}
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {event.location}
                </p>
              </div>
            </div>
          )}

          {/* Tickets */}
          <div className="flex items-start gap-2">
            <Ticket className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-sm font-medium">
                {booking.quantity} Ticket{booking.quantity > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {event.is_free ? "Free" : `$${booking.total_price.toFixed(2)}`}
              </p>
            </div>
          </div>

          {/* Booking Code */}
          <div className="flex items-start gap-2">
            <Ticket className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-sm font-medium">Booking Code</p>
              <p className="text-xs font-mono">{booking.booking_code}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/my-tickets/${booking.booking_code}`}>View Details</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/events/${event.slug}`}>View Event</Link>
          </Button>
          {!isCancelled && (
            <CancelBookingButton
              bookingId={booking.id}
              bookingCode={booking.booking_code}
              eventTitle={event.title}
              quantity={booking.quantity}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">{message}</p>
        <p className="text-muted-foreground mb-4">
          Browse events and book your tickets
        </p>
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
