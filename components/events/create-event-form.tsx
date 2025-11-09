'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/actions/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface CreateEventFormProps {
  organizationId: string;
  organizationSlug: string;
}

export function CreateEventForm({ organizationId, organizationSlug }: CreateEventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFree, setIsFree] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const venue_name = formData.get('venue_name') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const total_capacity = parseInt(formData.get('total_capacity') as string);
    const ticket_price = isFree ? 0 : parseFloat(formData.get('ticket_price') as string);
    const status = formData.get('status') as 'draft' | 'published';

    const result = await createEvent({
      organization_id: organizationId,
      title,
      description: description || undefined,
      location: location || undefined,
      venue_name: venue_name || undefined,
      start_date,
      end_date,
      total_capacity,
      ticket_price,
      is_free: isFree,
      status: status || 'draft',
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success('Etkinlik başarıyla oluşturuldu!');
    router.push(`/organizations/${organizationSlug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Etkinlik Adı *</Label>
        <Input
          id="title"
          name="title"
          placeholder="Örn: Yaz Konseri 2025"
          required
          minLength={3}
          maxLength={200}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <textarea
          id="description"
          name="description"
          placeholder="Etkinlik hakkında detaylı bilgi..."
          rows={6}
          maxLength={2000}
          disabled={loading}
          className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="venue_name">Mekan Adı</Label>
          <Input
            id="venue_name"
            name="venue_name"
            placeholder="Örn: İstanbul Kongre Merkezi"
            maxLength={200}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Konum</Label>
          <Input
            id="location"
            name="location"
            placeholder="Örn: İstanbul, Türkiye"
            maxLength={200}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Başlangıç Tarihi *</Label>
          <Input
            id="start_date"
            name="start_date"
            type="datetime-local"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Bitiş Tarihi *</Label>
          <Input
            id="end_date"
            name="end_date"
            type="datetime-local"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_capacity">Toplam Kapasite *</Label>
        <Input
          id="total_capacity"
          name="total_capacity"
          type="number"
          min="1"
          max="100000"
          placeholder="100"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_free"
            checked={isFree}
            onCheckedChange={(checked) => setIsFree(checked as boolean)}
            disabled={loading}
          />
          <Label htmlFor="is_free" className="cursor-pointer">
            Ücretsiz Etkinlik
          </Label>
        </div>

        {!isFree && (
          <div className="space-y-2">
            <Label htmlFor="ticket_price">Bilet Fiyatı (₺) *</Label>
            <Input
              id="ticket_price"
              name="ticket_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="50.00"
              required={!isFree}
              disabled={loading}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Durum *</Label>
        <select
          id="status"
          name="status"
          required
          disabled={loading}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="draft">Taslak</option>
          <option value="published">Yayınla</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Taslak: Sadece organizasyon yöneticileri görebilir. Yayınla: Herkes görebilir.
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Oluşturuluyor...' : 'Etkinlik Oluştur'}
        </Button>
      </div>
    </form>
  );
}
