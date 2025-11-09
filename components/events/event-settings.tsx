"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, MapPin, Users, DollarSign, FileText, Save, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventSettingsProps {
  event: {
    id: string;
    name: string;
    description: string;
    event_date: string;
    location: string;
    location_url: string | null;
    capacity: number;
    ticket_price: number;
    image_url: string | null;
    status: string;
  };
  organizationSlug: string;
}

export function EventSettings({ event, organizationSlug }: EventSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  // Parse event date for form
  const eventDateTime = new Date(event.event_date);
  const eventDateStr = eventDateTime.toISOString().split("T")[0];
  const eventTimeStr = eventDateTime.toTimeString().slice(0, 5);

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
    const status = formData.get("status") as string;

    const event_datetime = `${event_date}T${event_time}:00`;

    try {
      const { error } = await supabase
        .from("events")
        .update({
          name,
          description,
          event_date: event_datetime,
          location,
          location_url: location_url || null,
          capacity,
          ticket_price,
          image_url: image_url || null,
          status,
        })
        .eq("id", event.id);

      if (error) throw error;

      toast.success("Etkinlik güncellendi!");
      router.refresh();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Güncelleme sırasında hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bu etkinliği silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

      if (error) throw error;

      toast.success("Etkinlik silindi");
      router.push(`/organizations/${organizationSlug}/events`);
      router.refresh();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Silme sırasında hata oluştu");
      setIsDeleting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Etkinlik Ayarları</CardTitle>
            <CardDescription>Etkinlik bilgilerini güncelleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Etkinlik Adı <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={event.name}
                  required
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Açıklama <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={event.description}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Date and Time */}
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
                    defaultValue={eventDateStr}
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
                    defaultValue={eventTimeStr}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="inline-block h-4 w-4 mr-2" />
                  Lokasyon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={event.location}
                  required
                  maxLength={300}
                />
              </div>

              {/* Location URL */}
              <div className="space-y-2">
                <Label htmlFor="location_url">Lokasyon Harita Linki (opsiyonel)</Label>
                <Input
                  id="location_url"
                  name="location_url"
                  type="url"
                  defaultValue={event.location_url || ""}
                />
              </div>

              {/* Capacity and Price */}
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
                    defaultValue={event.capacity}
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
                    defaultValue={event.ticket_price}
                    required
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image_url">
                  <FileText className="inline-block h-4 w-4 mr-2" />
                  Etkinlik Görseli URL (opsiyonel)
                </Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  defaultValue={event.image_url || ""}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Durum <span className="text-destructive">*</span>
                </Label>
                <Select name="status" defaultValue={event.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="published">Yayında</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Taslak: Sadece siz görebilirsiniz. Yayında: Herkes görebilir ve bilet alabilir.
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <div className="lg:col-span-1">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
            <CardDescription>Geri alınamaz işlemler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Etkinliği Sil</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Etkinliği kalıcı olarak silmek istediğinizden emin olun. Bu işlem tüm rezervasyonları da silecektir.
              </p>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Siliniyor..." : "Etkinliği Sil"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
