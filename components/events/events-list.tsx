'use client';

import Link from 'next/link';
import { useState } from 'react';
import { deleteEvent, updateEventStatus } from '@/lib/actions/events';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  end_date: string;
  location: string | null;
  venue_name: string | null;
  ticket_price: number;
  is_free: boolean;
  total_capacity: number;
  available_capacity: number;
  status: 'draft' | 'published' | 'cancelled';
}

interface EventsListProps {
  events: Event[];
  organizationSlug: string;
  isOrganizer: boolean;
}

export function EventsList({ events, organizationSlug, isOrganizer }: EventsListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatusChange(
    eventId: string,
    status: 'draft' | 'published' | 'cancelled'
  ) {
    setLoading(eventId);
    const result = await updateEventStatus(eventId, status);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Durum güncellendi');
    }

    setLoading(null);
  }

  async function handleDelete(eventId: string, eventTitle: string) {
    if (!confirm(`"${eventTitle}" etkinliği silinsin mi? Bu işlem geri alınamaz.`)) {
      return;
    }

    setLoading(eventId);
    const result = await deleteEvent(eventId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Etkinlik silindi');
    }

    setLoading(null);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'published':
        return <Badge variant="default">Yayında</Badge>;
      case 'draft':
        return <Badge variant="secondary">Taslak</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">İptal Edildi</Badge>;
      default:
        return null;
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Henüz etkinlik oluşturulmamış.</p>
        {isOrganizer && (
          <Button asChild>
            <Link href={`/organizations/${organizationSlug}/events/new`}>
              İlk Etkinliği Oluştur
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        const isPast = endDate < new Date();
        const bookedPercentage =
          ((event.total_capacity - event.available_capacity) / event.total_capacity) * 100;

        return (
          <div
            key={event.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    href={`/events/${event.slug}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {event.title}
                  </Link>
                  {getStatusBadge(event.status)}
                  {isPast && <Badge variant="outline">Geçmiş</Badge>}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    📅 {startDate.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {event.venue_name && <p>📍 {event.venue_name}</p>}
                  {event.location && <p>{event.location}</p>}
                  <p>
                    💺 {event.available_capacity} / {event.total_capacity} kişi (
                    {bookedPercentage.toFixed(0)}% dolu)
                  </p>
                  <p className="font-medium">
                    {event.is_free ? (
                      <span className="text-green-600">Ücretsiz</span>
                    ) : (
                      <span>₺{event.ticket_price.toFixed(2)}</span>
                    )}
                  </p>
                </div>
              </div>

              {isOrganizer && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={loading === event.id}>
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {event.status !== 'published' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(event.id, 'published')}
                      >
                        Yayınla
                      </DropdownMenuItem>
                    )}
                    {event.status === 'published' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(event.id, 'draft')}
                      >
                        Taslağa Al
                      </DropdownMenuItem>
                    )}
                    {event.status !== 'cancelled' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(event.id, 'cancelled')}
                      >
                        İptal Et
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDelete(event.id, event.title)}
                      className="text-destructive"
                    >
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
