import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getEventById } from '@/lib/actions/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get event by slug
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug,
        description,
        logo_url
      )
    `)
    .eq('slug', slug);

  const event = events?.[0];

  if (!event) {
    notFound();
  }

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isPast = endDate < new Date();
  const bookedPercentage =
    ((event.total_capacity - event.available_capacity) / event.total_capacity) * 100;
  const isFull = event.available_capacity === 0;

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/events">← Etkinliklere Dön</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div>
              <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
              <CardDescription>
                <Link 
                  href={`/organizations/${event.organization.slug}`}
                  className="hover:underline"
                >
                  {event.organization.name}
                </Link>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {event.status === 'published' && <Badge variant="default">Yayında</Badge>}
              {event.status === 'cancelled' && (
                <Badge variant="destructive">İptal Edildi</Badge>
              )}
              {isPast && <Badge variant="outline">Geçmiş</Badge>}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {event.description && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Açıklama</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">📅 Tarih ve Saat</h3>
                <p className="text-muted-foreground">
                  <strong>Başlangıç:</strong>{' '}
                  {startDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-muted-foreground">
                  <strong>Bitiş:</strong>{' '}
                  {endDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {(event.venue_name || event.location) && (
                <div>
                  <h3 className="font-semibold mb-2">📍 Mekan</h3>
                  {event.venue_name && (
                    <p className="text-muted-foreground">{event.venue_name}</p>
                  )}
                  {event.location && (
                    <p className="text-muted-foreground">{event.location}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">💺 Kapasite</h3>
                <p className="text-muted-foreground">
                  <strong>Toplam:</strong> {event.total_capacity} kişi
                </p>
                <p className="text-muted-foreground">
                  <strong>Müsait:</strong> {event.available_capacity} kişi
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${bookedPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  %{bookedPercentage.toFixed(0)} dolu
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">💰 Fiyat</h3>
                {event.is_free ? (
                  <Badge className="bg-green-600 text-lg">Ücretsiz</Badge>
                ) : (
                  <p className="text-2xl font-bold">₺{event.ticket_price.toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-4">
            {!user ? (
              <Button asChild size="lg">
                <Link href="/auth/login">Bilet Almak İçin Giriş Yapın</Link>
              </Button>
            ) : isPast ? (
              <Button disabled size="lg">
                Etkinlik Sona Erdi
              </Button>
            ) : event.status === 'cancelled' ? (
              <Button disabled size="lg">
                Etkinlik İptal Edildi
              </Button>
            ) : isFull ? (
              <Button disabled size="lg">
                Biletler Tükendi
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href={`/events/${event.slug}/book`}>Bilet Al</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
