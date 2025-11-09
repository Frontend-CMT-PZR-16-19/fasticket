import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublishedEvents } from '@/lib/actions/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function EventsPage() {
  const result = await getPublishedEvents();

  if (result.error) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive">Hata: {result.error}</p>
      </div>
    );
  }

  const events = result.data || [];

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Etkinlikler</h1>
        <p className="text-muted-foreground mt-2">
          Yaklaşan etkinliklere göz atın ve biletlerinizi alın
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Şu anda yayında olan etkinlik bulunmuyor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => {
            const startDate = new Date(event.start_date);
            const bookedPercentage =
              ((event.total_capacity - event.available_capacity) / event.total_capacity) * 100;

            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <CardDescription>
                      {event.organization?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <p>
                        📅 {startDate.toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      {event.venue_name && <p>📍 {event.venue_name}</p>}
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        {event.is_free ? (
                          <Badge className="bg-green-600">Ücretsiz</Badge>
                        ) : (
                          <Badge>₺{event.ticket_price.toFixed(2)}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.available_capacity > 0 ? (
                          <span>{event.available_capacity} yer</span>
                        ) : (
                          <span className="text-destructive">Dolu</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
