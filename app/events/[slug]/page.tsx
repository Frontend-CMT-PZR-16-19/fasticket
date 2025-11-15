import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Users, Ticket, Clock } from "lucide-react";
import { BookEventButton } from "@/components/book-event-button";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch event with organization
  const { data: event, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organization:organizations(id, name, slug, logo_url)
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !event) {
    notFound();
  }

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const now = new Date();
  const isUpcoming = startDate > now;
  const isOngoing = startDate <= now && endDate > now;
  const isPast = endDate <= now;

  // Check if user has already booked
  let userBooking = null;
  if (user) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .single();
    
    userBooking = data;
  }

  const canBook = event.status === "published" && 
                  event.available_capacity > 0 && 
                  !isPast && 
                  !userBooking;

  return (
    <div className="container mx-auto py-8 px-4">
      <Link
        href={`/organizations/${event.organization.slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {event.organization.name}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {event.cover_image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                <Link
                  href={`/organizations/${event.organization.slug}`}
                  className="text-lg text-muted-foreground hover:underline"
                >
                  by {event.organization.name}
                </Link>
              </div>
              <Badge
                variant={
                  event.status === "published"
                    ? isOngoing
                      ? "default"
                      : isUpcoming
                      ? "secondary"
                      : "outline"
                    : "secondary"
                }
              >
                {isPast ? "Past" : isOngoing ? "Ongoing" : isUpcoming ? "Upcoming" : event.status}
              </Badge>
            </div>

            {event.description && (
              <div className="prose max-w-none">
                <p className="text-lg text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {startDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {startDate.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {endDate.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {event.venue_name && `${event.venue_name}, `}
                      {event.location}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Capacity</p>
                  <p className="text-sm text-muted-foreground">
                    {event.available_capacity} / {event.total_capacity} spots available
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ticket className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Price</p>
                  <p className="text-sm text-muted-foreground">
                    {event.is_free ? "Free" : `$${event.ticket_price.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {userBooking ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      You're registered!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Booking code: {userBooking.booking_code}
                    </p>
                  </div>
                  <Link href="/my-tickets">
                    <Button variant="outline" className="w-full">
                      View My Tickets
                    </Button>
                  </Link>
                </div>
              ) : canBook ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold mb-1">
                      {event.is_free ? "Free" : `$${event.ticket_price.toFixed(2)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.available_capacity} spots left
                    </p>
                  </div>
                  {user ? (
                    <BookEventButton
                      eventId={event.id}
                      eventTitle={event.title}
                      isFree={event.is_free}
                      ticketPrice={event.ticket_price}
                      availableCapacity={event.available_capacity}
                    />
                  ) : (
                    <Link href="/auth/login">
                      <Button className="w-full" size="lg">
                        Login to Book
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    {event.available_capacity === 0
                      ? "Event is sold out"
                      : isPast
                      ? "Event has ended"
                      : "Booking unavailable"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organized by</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/organizations/${event.organization.slug}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-semibold">
                  {event.organization.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold">{event.organization.name}</p>
                  <p className="text-sm text-muted-foreground">View profile →</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
