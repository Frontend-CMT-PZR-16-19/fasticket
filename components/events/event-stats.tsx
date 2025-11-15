"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface EventStatsProps {
  event: {
    id: string;
    name: string;
    capacity: number;
    available_capacity: number;
    ticket_price: number;
    event_date: string;
  };
  bookings: any[];
  stats: {
    totalBookings: number;
    confirmedBookings: number;
    totalAttendees: number;
    checkedInCount: number;
    totalRevenue: number;
  };
}

export function EventStats({ event, bookings, stats }: EventStatsProps) {
  const soldCapacity = event.capacity - event.available_capacity;
  const capacityPercentage = (soldCapacity / event.capacity) * 100;
  const checkInPercentage = stats.totalAttendees > 0
    ? (stats.checkedInCount / stats.totalAttendees) * 100
    : 0;

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc: any, booking: any) => {
    const date = format(new Date(booking.created_at), "d MMM", { locale: tr });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const isFree = event.ticket_price === 0;
  const averageTicketPrice = stats.confirmedBookings > 0
    ? stats.totalRevenue / stats.confirmedBookings
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Capacity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kapasite Durumu
          </CardTitle>
          <CardDescription>Etkinlik doluluk oranı</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Doluluk</span>
              <span className="font-medium">{capacityPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={capacityPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{soldCapacity} satıldı</span>
              <span>{event.available_capacity} kalan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Kapasite</p>
              <p className="text-2xl font-bold">{event.capacity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Katılımcı</p>
              <p className="text-2xl font-bold">{stats.totalAttendees}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Check-in Durumu
          </CardTitle>
          <CardDescription>Katılımcı giriş bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Check-in Oranı</span>
              <span className="font-medium">{checkInPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={checkInPercentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stats.checkedInCount} check-in</span>
              <span>{stats.totalAttendees - stats.checkedInCount} bekliyor</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Giriş Yaptı</p>
              <p className="text-2xl font-bold">{stats.checkedInCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bekliyor</p>
              <p className="text-2xl font-bold">{stats.totalAttendees - stats.checkedInCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Stats */}
      {!isFree && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Gelir İstatistikleri
            </CardTitle>
            <CardDescription>Finansal özet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Gelir</p>
                <p className="text-3xl font-bold">₺{stats.totalRevenue.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Ortalama Fiyat</p>
                  <p className="text-xl font-bold">₺{averageTicketPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bilet Fiyatı</p>
                  <p className="text-xl font-bold">₺{event.ticket_price.toFixed(2)}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Potansiyel Gelir</p>
                <p className="text-lg font-semibold">
                  ₺{(event.capacity * event.ticket_price).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tüm biletler satılırsa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rezervasyon Trendi
          </CardTitle>
          <CardDescription>Günlük rezervasyon dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(bookingsByDate).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Henüz rezervasyon yok
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(bookingsByDate)
                .slice(0, 10)
                .map(([date, count]: [string, any]) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(count / stats.totalBookings) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card className={isFree ? "lg:col-span-2" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Etkinlik Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Etkinlik Adı</dt>
              <dd className="font-medium">{event.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Tarih</dt>
              <dd className="font-medium">
                {format(new Date(event.event_date), "d MMMM yyyy, HH:mm", { locale: tr })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Toplam Rezervasyon</dt>
              <dd className="font-medium">{stats.totalBookings}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Onaylı Rezervasyon</dt>
              <dd className="font-medium">{stats.confirmedBookings}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
