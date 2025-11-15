import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, Plus, Settings } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getUserRoleInOrganization } from "@/lib/auth/permissions";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganizationEventsPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get organization by slug
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !organization) {
    notFound();
  }

  // Check if user is organizer
  let isOrganizer = false;
  if (user) {
    const role = await getUserRoleInOrganization(user.id, organization.id);
    isOrganizer = role === "organizer";
  }

  // Get organization's events (show all statuses if organizer, only published if not)
  const query = supabase
    .from("events")
    .select("*")
    .eq("organization_id", organization.id)
    .order("event_date", { ascending: true });

  if (!isOrganizer) {
    query.eq("status", "published");
  }

  const { data: events } = await query;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{organization.name} - Etkinlikler</h1>
            <p className="text-muted-foreground">
              {isOrganizer
                ? "Organizasyonunuzun tüm etkinliklerini yönetin"
                : "Bu organizasyonun yaklaşan etkinlikleri"}
            </p>
          </div>
          {isOrganizer && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/organizations/${slug}/manage`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Yönet
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/organizations/${slug}/events/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Etkinlik
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {!events || events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Henüz etkinlik yok</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isOrganizer
                ? "İlk etkinliğinizi oluşturarak başlayın"
                : "Yakında yeni etkinlikler eklenecek"}
            </p>
            {isOrganizer && (
              <Button asChild>
                <Link href={`/organizations/${slug}/events/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Etkinlik Oluştur
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventDate = new Date(event.event_date);
            const isFree = event.ticket_price === 0;
            const isSoldOut = event.available_capacity === 0;
            const isPast = eventDate < new Date();
            const isDraft = event.status === "draft";
            const isCancelled = event.status === "cancelled";

            return (
              <Card key={event.id} className="flex flex-col">
                {event.image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg relative">
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="h-full w-full object-cover"
                    />
                    {(isDraft || isCancelled) && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant={isCancelled ? "destructive" : "secondary"} className="text-lg">
                          {isCancelled ? "İptal Edildi" : "Taslak"}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{event.name}</CardTitle>
                    <div className="flex flex-col gap-1">
                      {isSoldOut && !isCancelled && (
                        <Badge variant="destructive">Tükendi</Badge>
                      )}
                      {isPast && !isCancelled && (
                        <Badge variant="secondary">Geçmiş</Badge>
                      )}
                      {isDraft && (
                        <Badge variant="outline">Taslak</Badge>
                      )}
                      {isCancelled && (
                        <Badge variant="destructive">İptal</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
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
                <CardFooter className="flex gap-2">
                  {isOrganizer ? (
                    <>
                      <Button asChild className="flex-1" variant="outline">
                        <Link href={`/events/${event.id}`}>Görüntüle</Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href={`/events/${event.id}/manage`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Yönet
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full" disabled={isSoldOut || isCancelled}>
                      <Link href={`/events/${event.id}`}>
                        {isCancelled ? "İptal Edildi" : isSoldOut ? "Tükendi" : "Detayları Gör"}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
