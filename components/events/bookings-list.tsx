"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreVertical, CheckCircle2, XCircle, Mail, Phone, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Booking {
  id: string;
  booking_code: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  attendee_count: number;
  total_price: number;
  status: string;
  checked_in_at: string | null;
  created_at: string;
  user: {
    id: string;
    fullname: string;
    avatar_url: string | null;
  } | null;
}

interface BookingsListProps {
  bookings: Booking[];
  eventId: string;
}

export function BookingsList({ bookings, eventId }: BookingsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.attendee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.attendee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.booking_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckIn = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Katılımcı başarıyla check-in yapıldı");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Check-in yapılırken hata oluştu");
    }
  };

  const handleCancelCheckIn = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ checked_in_at: null })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Check-in iptal edildi");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Check-in iptal edilirken hata oluştu");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Bu rezervasyonu iptal etmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Rezervasyon iptal edildi");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Rezervasyon iptal edilirken hata oluştu");
    }
  };

  const exportToCSV = () => {
    const headers = ["Rezervasyon Kodu", "İsim", "E-posta", "Telefon", "Katılımcı Sayısı", "Fiyat", "Durum", "Check-in", "Tarih"];
    const rows = bookings.map((b) => [
      b.booking_code,
      b.attendee_name,
      b.attendee_email,
      b.attendee_phone || "-",
      b.attendee_count,
      b.total_price,
      b.status,
      b.checked_in_at ? "Evet" : "Hayır",
      format(new Date(b.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rezervasyonlar-${eventId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rezervasyonlar ({bookings.length})</CardTitle>
            <CardDescription>Tüm rezervasyonları yönetin ve check-in yapın</CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            CSV İndir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim, e-posta veya rezervasyon kodu ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "Sonuç bulunamadı" : "Henüz rezervasyon yok"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <Avatar>
                    <AvatarImage src={booking.user?.avatar_url || ""} />
                    <AvatarFallback>{getInitials(booking.attendee_name)}</AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-medium">{booking.attendee_name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {booking.booking_code}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {booking.attendee_email}
                      </div>
                      {booking.attendee_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.attendee_phone}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={booking.status === "confirmed" ? "default" : "destructive"}>
                        {booking.status === "confirmed" ? "Onaylı" : "İptal"}
                      </Badge>
                      {booking.checked_in_at && (
                        <Badge variant="secondary">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Check-in: {format(new Date(booking.checked_in_at), "HH:mm", { locale: tr })}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {booking.attendee_count} kişi
                      </span>
                      <span className="text-sm font-medium">
                        {booking.total_price === 0 ? "Ücretsiz" : `₺${booking.total_price.toFixed(2)}`}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Rezervasyon: {format(new Date(booking.created_at), "d MMM yyyy, HH:mm", { locale: tr })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {booking.status === "confirmed" && (
                      <>
                        {!booking.checked_in_at ? (
                          <DropdownMenuItem onClick={() => handleCheckIn(booking.id)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Check-in Yap
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleCancelCheckIn(booking.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Check-in İptal
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rezervasyonu İptal Et
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
