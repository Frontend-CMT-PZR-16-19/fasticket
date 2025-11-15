import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, Eye, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { requireEventManager } from "@/lib/auth/permissions";
import { EventSettings } from "@/components/events/event-settings";
import { BookingsList } from "@/components/events/bookings-list";
import { EventStats } from "@/components/events/event-stats";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventManagePage({ params }: PageProps) {
  const { id } = await params;
  await requireEventManager(id);

  const supabase = await createClient();

  // Get event with organization
  const { data: event, error } = await supabase
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
    .eq("id", id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Get bookings with user profiles
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_code,
      attendee_name,
      attendee_email,
      attendee_phone,
      attendee_count,
      total_price,
      status,
      checked_in_at,
      created_at,
      user:profiles!bookings_user_id_fkey (
        id,
        fullname,
        avatar_url
      )
    `)
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  // Transform the data to match the expected type
  const bookings = bookingsData?.map((booking: any) => ({
    ...booking,
    user: Array.isArray(booking.user) ? booking.user[0] : booking.user
  })) || [];

  // Calculate statistics
  const totalBookings = bookings?.length || 0;
  const confirmedBookings = bookings?.filter((b) => b.status === "confirmed").length || 0;
  const totalAttendees = bookings?.reduce((sum, b) => sum + (b.attendee_count || 0), 0) || 0;
  const checkedInCount = bookings?.filter((b) => b.checked_in_at).length || 0;
  const totalRevenue = bookings
    ?.filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

  const eventDate = new Date(event.event_date);
  const isFree = event.ticket_price === 0;

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/events/${event.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Etkinlik Sayfasına Dön
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(eventDate, "d MMMM yyyy, HH:mm", { locale: tr })}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
              <Badge variant={
                event.status === "published" ? "default" :
                event.status === "draft" ? "secondary" :
                "destructive"
              }>
                {event.status === "published" ? "Yayında" :
                 event.status === "draft" ? "Taslak" : "İptal"}
              </Badge>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href={`/events/${event.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Önizleme
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Rezervasyon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Onaylı Rezervasyon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{confirmedBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Katılımcı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAttendees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              / {event.capacity} kapasite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Check-in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{checkedInCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              / {totalAttendees} katılımcı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Gelir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isFree ? "₺0" : `₺${totalRevenue.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">
            <Users className="mr-2 h-4 w-4" />
            Rezervasyonlar
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            İstatistikler
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Calendar className="mr-2 h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <BookingsList bookings={bookings || []} eventId={event.id} />
        </TabsContent>

        <TabsContent value="stats">
          <EventStats
            event={event}
            bookings={bookings || []}
            stats={{
              totalBookings,
              confirmedBookings,
              totalAttendees,
              checkedInCount,
              totalRevenue,
            }}
          />
        </TabsContent>

        <TabsContent value="settings">
          <EventSettings event={event} organizationSlug={event.organization.slug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
