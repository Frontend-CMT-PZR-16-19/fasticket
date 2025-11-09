import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, Building2, ExternalLink, Settings, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { canManageEvent } from "@/lib/auth/permissions";
import { BookEventForm } from "@/components/events/book-event-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get event with organization info
  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug,
        logo_url,
        description
      )
    `)
    .eq("id", id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Check if user can manage this event
  let canManage = false;
  if (user) {
    canManage = await canManageEvent(user.id, event.id);
  }

  // Check if user already has a booking
  let existingBooking = null;
  if (user) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .single();
    
    existingBooking = booking;
  }

  const eventDate = new Date(event.event_date);
  const isFree = event.ticket_price === 0;
  const isSoldOut = event.available_capacity === 0;
  const isPast = eventDate < new Date();
  const isDraft = event.status === "draft";
  const isCancelled = event.status === "cancelled";
  const isPublished = event.status === "published";
  const canBook = isPublished && !isSoldOut && !isPast && !isCancelled && user && !existingBooking;

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tüm Etkinlikler
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          {event.image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={event.image_url}
                alt={event.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Event Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{event.name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {isDraft && <Badge variant="outline">Taslak</Badge>}
                    {isCancelled && <Badge variant="destructive">İptal Edildi</Badge>}
                    {isSoldOut && !isCancelled && <Badge variant="destructive">Tükendi</Badge>}
                    {isPast && !isCancelled && <Badge variant="secondary">Geçmiş Etkinlik</Badge>}
                    {isFree && <Badge variant="secondary">Ücretsiz</Badge>}
                  </div>
                </div>
                {canManage && (
                  <Button asChild>
                    <Link href={`/events/${event.id}/manage`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Yönet
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Açıklama</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Detaylar</h3>
                
                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Tarih ve Saat</p>
                    <p className="text-muted-foreground">
                      {format(eventDate, "d MMMM yyyy, EEEE", { locale: tr })}
                    </p>
                    <p className="text-muted-foreground">
                      {format(eventDate, "HH:mm", { locale: tr })}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Lokasyon</p>
                    <p className="text-muted-foreground">{event.location}</p>
                    {event.location_url && (
                      <a
                        href={event.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        Haritada Gör
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Kapasite</p>
                    <p className="text-muted-foreground">
                      {event.available_capacity} / {event.capacity} kişi müsait
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Fiyat</p>
                    <p className="text-lg font-bold">
                      {isFree ? "ÜCRETSİZ" : `${event.ticket_price.toFixed(2)} ₺`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Organization */}
              <div>
                <h3 className="font-semibold mb-3">Organizatör</h3>
                <Link href={`/organizations/${event.organization.slug}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="flex items-center gap-4 p-4">
                      {event.organization.logo_url ? (
                        <img
                          src={event.organization.logo_url}
                          alt={event.organization.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{event.organization.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {event.organization.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Booking */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bilet Al</CardTitle>
                <CardDescription>
                  {isFree ? "Ücretsiz etkinlik" : `${event.ticket_price.toFixed(2)} ₺`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Bilet almak için giriş yapmalısınız
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/auth/login">Giriş Yap</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/auth/sign-up">Kayıt Ol</Link>
                    </Button>
                  </div>
                ) : existingBooking ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="font-medium text-green-900 dark:text-green-100 mb-2">
                        Biletiniz Onaylandı!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Rezervasyon Kodu: <span className="font-mono font-bold">{existingBooking.booking_code}</span>
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bu etkinlik için zaten bir biletiniz var.
                    </p>
                  </div>
                ) : isCancelled ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive">
                      Bu etkinlik iptal edildi.
                    </p>
                  </div>
                ) : isDraft ? (
                  <div className="bg-muted border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Bu etkinlik henüz yayınlanmadı.
                    </p>
                  </div>
                ) : isPast ? (
                  <div className="bg-muted border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Bu etkinlik sona erdi.
                    </p>
                  </div>
                ) : isSoldOut ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive">
                      Tüm biletler tükendi.
                    </p>
                  </div>
                ) : canBook ? (
                  <BookEventForm event={event} userId={user.id} />
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
