"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, MapPin, Users, DollarSign, FileText } from "lucide-react";

interface CreateEventFormProps {
  organizationId: string;
  organizationSlug: string;
}

export function CreateEventForm({ organizationId, organizationSlug }: CreateEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const event_date = formData.get("event_date") as string;
    const event_time = formData.get("event_time") as string;
    const location = formData.get("location") as string;
    const location_url = formData.get("location_url") as string;
    const capacity = parseInt(formData.get("capacity") as string);
    const ticket_price = parseFloat(formData.get("ticket_price") as string);
    const image_url = formData.get("image_url") as string;

    // Tarih ve saati birleştir
    const event_datetime = `${event_date}T${event_time}:00`;

    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          organization_id: organizationId,
          name,
          description,
          event_date: event_datetime,
          location,
          location_url: location_url || null,
          capacity,
          available_capacity: capacity, // Başlangıçta tüm kapasite müsait
          ticket_price,
          image_url: image_url || null,
          status: "draft", // Taslak olarak başlat
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Etkinlik başarıyla oluşturuldu!");
      router.push(`/events/${data.id}/manage`);
      router.refresh();
    } catch (error: any) {
      console.error("Event creation error:", error);
      toast.error(error.message || "Etkinlik oluşturulurken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  // Minimum tarih - bugün
  const today = new Date().toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etkinlik Bilgileri</CardTitle>
        <CardDescription>
          Etkinliğiniz için gerekli bilgileri doldurun
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Etkinlik Adı */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Etkinlik Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="örn: React Workshop 2025"
              required
              maxLength={200}
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Açıklama <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="description"
              name="description"
              placeholder="Etkinliğiniz hakkında detaylı bilgi verin..."
              required
              rows={5}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Tarih ve Saat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">
                <Calendar className="inline-block h-4 w-4 mr-2" />
                Tarih <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event_date"
                name="event_date"
                type="date"
                min={today}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time">
                Saat <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event_time"
                name="event_time"
                type="time"
                required
              />
            </div>
          </div>

          {/* Lokasyon */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="inline-block h-4 w-4 mr-2" />
              Lokasyon <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="örn: İstanbul Kongre Merkezi, Salon A"
              required
              maxLength={300}
            />
          </div>

          {/* Lokasyon URL (opsiyonel) */}
          <div className="space-y-2">
            <Label htmlFor="location_url">Lokasyon Harita Linki (opsiyonel)</Label>
            <Input
              id="location_url"
              name="location_url"
              type="url"
              placeholder="https://maps.google.com/..."
            />
          </div>

          {/* Kapasite ve Fiyat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">
                <Users className="inline-block h-4 w-4 mr-2" />
                Kapasite <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                placeholder="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_price">
                <DollarSign className="inline-block h-4 w-4 mr-2" />
                Bilet Fiyatı (₺) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ticket_price"
                name="ticket_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Ücretsiz etkinlikler için 0 girin
              </p>
            </div>
          </div>

          {/* Görsel URL (opsiyonel) */}
          <div className="space-y-2">
            <Label htmlFor="image_url">
              <FileText className="inline-block h-4 w-4 mr-2" />
              Etkinlik Görseli URL (opsiyonel)
            </Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              placeholder="https://example.com/event-image.jpg"
            />
          </div>

          {/* Butonlar */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Oluşturuluyor..." : "Etkinlik Oluştur"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/organizations/${organizationSlug}`)}
              disabled={isLoading}
            >
              İptal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
