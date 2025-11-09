'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { cancelBooking } from '@/lib/actions/bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import type { BookingWithEventAndOrganization } from '@/types/database';

interface BookingsListProps {
  bookings: BookingWithEventAndOrganization[];
}

export function BookingsList({ bookings }: BookingsListProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = (bookingId: string, eventTitle: string) => {
    if (!confirm(`"${eventTitle}" etkinliği için rezervasyonunuzu iptal etmek istediğinizden emin misiniz?`)) {
      return;
    }

    startTransition(async () => {
      const result = await cancelBooking(bookingId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Rezervasyon iptal edildi');
      }
    });
  };

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon="🎫"
        title="Henüz Rezervasyonunuz Yok"
        description="Etkinliklere göz atarak bilet rezervasyonu yapabilirsiniz."
        actionLabel="Etkinlikleri Keşfet"
        actionHref="/events"
      />
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const event = booking.events;
        const isPast = event ? new Date(event.end_date) < new Date() : false;
        const isCancelled = booking.status === 'cancelled';
        const canCancel = booking.status === 'confirmed' && !isPast;

        return (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    {event?.title || 'Etkinlik Bulunamadı'}
                  </CardTitle>
                  {event?.organizations && (
                    <CardDescription>
                      {event.organizations.name}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={isCancelled ? 'destructive' : isPast ? 'secondary' : 'default'}>
                  {isCancelled ? 'İptal Edildi' : isPast ? 'Tamamlandı' : 'Aktif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Booking Code */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Rezervasyon Kodu
                </div>
                <div className="font-mono text-lg font-semibold">
                  {booking.booking_code}
                </div>
              </div>

              {/* Event Details */}
              {event && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">📅</span>
                    <span>
                      {new Date(event.start_date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {event.venue_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">📍</span>
                      <span>{event.venue_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">🎫</span>
                    <span>{booking.quantity} Bilet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">💰</span>
                    <span>
                      {event.is_free
                        ? 'Ücretsiz'
                        : `₺${booking.total_price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Reservation Date */}
              <div className="text-xs text-muted-foreground">
                Rezervasyon tarihi:{' '}
                {new Date(booking.created_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              {event && (
                <Link href={`/events/${event.slug}`}>
                  <Button variant="outline" size="sm">
                    Etkinlik Detayı
                  </Button>
                </Link>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancel(booking.id, event?.title || '')}
                  disabled={isPending}
                >
                  İptal Et
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
