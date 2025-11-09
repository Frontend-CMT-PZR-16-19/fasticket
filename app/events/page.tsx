import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function EventsPage() {
  const supabase = await createClient();

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
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
