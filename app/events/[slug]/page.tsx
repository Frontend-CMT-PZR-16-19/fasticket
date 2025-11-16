import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookEventButton } from "@/components/bookings/book-event-button";
import { isOrganizer } from "@/lib/auth/server-permissions";
import Link from "next/link";
import { Calendar, MapPin, Users, Building2, Clock, Settings } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: event } = await supabase
    .from("events")
    .select("title, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    return { title: "Event Not Found" };
  }

  return {
    title: `${event.title} - Fasticket`,
    description: event.description || `Book tickets for ${event.title}`,
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get event with organization
  const { data: event, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organization:organizations(*)
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const now = new Date();
  const isUpcoming = startDate > now;
  const isOngoing = startDate <= now && endDate > now;
  const isPast = endDate <= now;

  // Check if user is organizer of this event
  const userIsOrganizer = user ? await isOrganizer(event.organization_id) : false;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image */}
          {event.cover_image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Title and Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={event.status === "published" ? "default" : "outline"}>
                {event.status}
              </Badge>
              {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
              {isOngoing && <Badge variant="default">Happening Now</Badge>}
              {isPast && <Badge variant="outline">Past Event</Badge>}
            </div>
            <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

            {/* Organization */}
            <Link
              href={`/organizations/${event.organization.slug}`}
              className="flex items-center gap-3 hover:underline"
            >
              {event.organization.logo_url && (
                <Avatar>
                  <AvatarImage src={event.organization.logo_url} />
                  <AvatarFallback>
                    {event.organization.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Organized by</p>
                <p className="font-medium">{event.organization.name}</p>
              </div>
            </Link>
          </div>

          {/* Description */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{event.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date & Time */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Start</p>
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
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">End</p>
                    <p className="text-sm text-muted-foreground">
                      {endDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {endDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    {event.venue_name && (
                      <p className="text-sm font-medium">{event.venue_name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Capacity */}
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Availability</p>
                  <p className="text-sm text-muted-foreground">
                    {event.available_capacity} of {event.total_capacity} tickets
                    available
                  </p>
                  <div className="mt-2 w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (event.available_capacity / event.total_capacity) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Price</span>
                  <span className="text-2xl font-bold">
                    {event.is_free ? "Free" : `$${event.ticket_price}`}
                  </span>
                </div>

                {/* Book Button */}
                {event.available_capacity > 0 && !isPast ? (
                  <BookEventButton
                    event={event}
                    isAuthenticated={!!user}
                  />
                ) : isPast ? (
                  <BookEventButton
                    event={event}
                    isAuthenticated={!!user}
                    disabled={true}
                  />
                ) : (
                  <BookEventButton
                    event={event}
                    isAuthenticated={!!user}
                    disabled={true}
                  />
                )}

                {!user && event.available_capacity > 0 && !isPast && (
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    <Link href="/auth/login" className="underline hover:text-primary">
                      Sign in
                    </Link>{" "}
                    or{" "}
                    <Link href="/auth/sign-up" className="underline hover:text-primary">
                      create an account
                    </Link>{" "}
                    to book tickets
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manage Bookings Button (Organizers Only) */}
          {userIsOrganizer && (
            <Card>
              <CardHeader>
                <CardTitle>Organizer Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/events/${event.slug}/bookings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Bookings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Organization Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/organizations/${event.organization.slug}`}
                className="flex items-center gap-3 hover:underline"
              >
                <Building2 className="h-8 w-8" />
                <div>
                  <p className="font-medium">{event.organization.name}</p>
                  {event.organization.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.organization.description}
                    </p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
