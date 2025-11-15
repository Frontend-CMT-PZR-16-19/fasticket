"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ticket } from "lucide-react";

interface BookEventFormProps {
  event: {
    id: string;
    name: string;
    ticket_price: number;
    available_capacity: number;
  };
  userId: string;
}

export function BookEventForm({ event, userId }: BookEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(1);

  const supabase = createClient();
  const isFree = event.ticket_price === 0;
  const totalPrice = event.ticket_price * attendeeCount;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const attendee_name = formData.get("attendee_name") as string;
    const attendee_email = formData.get("attendee_email") as string;
    const attendee_phone = formData.get("attendee_phone") as string;

    try {
      // Check if still available
      const { data: currentEvent } = await supabase
        .from("events")
        .select("available_capacity")
        .eq("id", event.id)
        .single();

      if (!currentEvent || currentEvent.available_capacity < attendeeCount) {
        toast.error("Yeterli kapasite yok!");
        router.refresh();
        return;
      }

      // Create booking
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          event_id: event.id,
          user_id: userId,
          attendee_name,
          attendee_email,
          attendee_phone: attendee_phone || null,
          attendee_count: attendeeCount,
          total_price: totalPrice,
          status: "confirmed",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Biletiniz başarıyla alındı!", {
        description: `Rezervasyon kodunuz: ${booking.booking_code}`,
      });
      
      router.refresh();
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Bilet alırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Attendee Count */}
      <div className="space-y-2">
        <Label htmlFor="attendee_count">
          Katılımcı Sayısı <span className="text-destructive">*</span>
        </Label>
        <Input
          id="attendee_count"
          name="attendee_count"
          type="number"
          min="1"
          max={Math.min(event.available_capacity, 10)}
          value={attendeeCount}
          onChange={(e) => setAttendeeCount(parseInt(e.target.value) || 1)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Maksimum {Math.min(event.available_capacity, 10)} kişi
        </p>
      </div>

      {/* Attendee Name */}
      <div className="space-y-2">
        <Label htmlFor="attendee_name">
          İsim Soyisim <span className="text-destructive">*</span>
        </Label>
        <Input
          id="attendee_name"
          name="attendee_name"
          placeholder="Adınız ve soyadınız"
          required
          maxLength={100}
        />
      </div>

      {/* Attendee Email */}
      <div className="space-y-2">
        <Label htmlFor="attendee_email">
          E-posta <span className="text-destructive">*</span>
        </Label>
        <Input
          id="attendee_email"
          name="attendee_email"
          type="email"
          placeholder="email@example.com"
          required
          maxLength={100}
        />
      </div>

      {/* Attendee Phone */}
      <div className="space-y-2">
        <Label htmlFor="attendee_phone">Telefon (opsiyonel)</Label>
        <Input
          id="attendee_phone"
          name="attendee_phone"
          type="tel"
          placeholder="05XX XXX XX XX"
          maxLength={20}
        />
      </div>

      {/* Total Price */}
      {!isFree && (
        <div className="bg-muted rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Toplam</span>
            <span className="text-2xl font-bold">{totalPrice.toFixed(2)} ₺</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {attendeeCount} x {event.ticket_price.toFixed(2)} ₺
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        <Ticket className="mr-2 h-5 w-5" />
        {isLoading ? "İşleniyor..." : isFree ? "Ücretsiz Kaydol" : "Bilet Al"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Devam ederek{" "}
        <a href="/terms" className="underline">
          şartları
        </a>{" "}
        kabul etmiş olursunuz
      </p>
    </form>
  );
}
