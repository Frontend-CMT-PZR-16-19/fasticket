'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking } from '@/lib/actions/bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Event } from '@/types/database';

interface BookingFormProps {
  event: Event;
}

export function BookingForm({ event }: BookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);

  const totalPrice = event.is_free ? 0 : event.ticket_price * quantity;
  const maxQuantity = Math.min(event.available_capacity, 10); // Max 10 bilet

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity < 1 || quantity > maxQuantity) {
      toast.error(`Lütfen 1 ile ${maxQuantity} arasında bir miktar seçin`);
      return;
    }

    startTransition(async () => {
      const result = await createBooking({
        event_id: event.id,
        quantity,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Rezervasyonunuz oluşturuldu! 🎉');
        router.push('/bookings');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilet Rezervasyonu</CardTitle>
        <CardDescription>
          Lütfen rezervasyon detaylarını kontrol edin
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Event Info */}
          <div className="space-y-2">
            <h3 className="font-semibold">{event.title}</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>📍 {event.venue_name}</p>
              <p>📅 {new Date(event.start_date).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Bilet Sayısı</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Maksimum {maxQuantity} bilet alabilirsiniz
              {event.available_capacity < 10 && ` (Sadece ${event.available_capacity} yer kaldı)`}
            </p>
          </div>

          {/* Price Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bilet Fiyatı</span>
              <span>
                {event.is_free ? 'Ücretsiz' : `₺${event.ticket_price.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Adet</span>
              <span>×{quantity}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Toplam</span>
              <span className="text-lg">
                {event.is_free ? 'Ücretsiz' : `₺${totalPrice.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Warning */}
          {!event.is_free && (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              ℹ️ Bu bir simülasyondur. Gerçek ödeme yapılmayacaktır.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="flex-1"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isPending || quantity < 1 || quantity > maxQuantity}
            className="flex-1"
          >
            {isPending ? 'İşleniyor...' : 'Rezervasyonu Onayla'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
