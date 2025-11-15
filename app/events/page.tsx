import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
<<<<<<< HEAD
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, MapPin, Ticket } from "lucide-react";
=======
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e

export default async function EventsPage() {
  const supabase = await createClient();

<<<<<<< HEAD
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
=======
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get all published events
  const { data: events } = await supabase
    .from("events")
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq("status", "published")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Etkinlikler</h1>
          <p className="text-muted-foreground">
            Yaklaşan etkinlikleri keşfedin ve biletinizi alın
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/organizations">
              <Plus className="mr-2 h-4 w-4" />
              Organizasyonlarım
            </Link>
          </Button>
        )}
      </div>

      {!events || events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Henüz etkinlik yok</h3>
            <p className="text-muted-foreground text-center">
              Yakında yeni etkinlikler eklenecek
            </p>
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<<<<<<< HEAD
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
=======
          {events.map((event) => {
            const eventDate = new Date(event.event_date);
            const isFree = event.ticket_price === 0;
            const isSoldOut = event.available_capacity === 0;

            return (
              <Card key={event.id} className="flex flex-col">
                {event.image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{event.name}</CardTitle>
                    {isSoldOut && (
                      <Badge variant="destructive">Tükendi</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  {/* Organization */}
                  <div className="flex items-center gap-2">
                    {event.organization.logo_url ? (
                      <img
                        src={event.organization.logo_url}
                        alt={event.organization.name}
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-muted" />
                    )}
                    <Link
                      href={`/organizations/${event.organization.slug}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {event.organization.name}
                    </Link>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(eventDate, "d MMMM yyyy, HH:mm", { locale: tr })}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.available_capacity} / {event.capacity} kişi
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {isFree ? "ÜCRETSİZ" : `${event.ticket_price.toFixed(2)} ₺`}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" disabled={isSoldOut}>
                    <Link href={`/events/${event.id}`}>
                      {isSoldOut ? "Tükendi" : "Detayları Gör"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e
            );
          })}
        </div>
      )}
    </div>
  );
}
