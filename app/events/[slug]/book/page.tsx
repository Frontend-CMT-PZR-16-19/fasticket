import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getEventBySlugDirect } from '@/lib/actions/events';
import { hasUserBookedEvent } from '@/lib/actions/bookings';
import { BookingForm } from '@/components/bookings/booking-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function BookEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/events/${slug}/book`);
  }

  // Get event
  const event = await getEventBySlugDirect(slug);

  if (!event) {
    notFound();
  }

  // Check if event is published
  if (event.status !== 'published') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Rezervasyon Kapalı</CardTitle>
            <CardDescription>
              Bu etkinlik için rezervasyon kabul edilmiyor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/events/${slug}`}>
              <Button variant="outline">Etkinlik Detayına Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if event has capacity
  if (event.available_capacity <= 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Kapasite Doldu</CardTitle>
            <CardDescription>
              Maalesef bu etkinlik için tüm biletler tükendi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/events/${slug}`}>
              <Button variant="outline">Etkinlik Detayına Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user already has a booking
  const hasBooked = await hasUserBookedEvent(event.id);

  if (hasBooked) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Zaten Rezervasyonunuz Var</CardTitle>
            <CardDescription>
              Bu etkinlik için aktif bir rezervasyonunuz bulunuyor.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/bookings">
              <Button>Rezervasyonlarımı Gör</Button>
            </Link>
            <Link href={`/events/${slug}`}>
              <Button variant="outline">Etkinlik Detayına Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/events/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Etkinlik detayına dön
        </Link>
      </div>
      <BookingForm event={event} />
    </div>
  );
}
