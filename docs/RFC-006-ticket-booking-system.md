# RFC-006: Ticket Booking System

**Status**: Draft  
**Created**: 8 Kasım 2025  
**Author**: GitHub Copilot  
**Related**: RFC-001, RFC-005

## Abstract

Bu RFC, bilet rezervasyon sistemini detaylandırır: "satın alma" simülasyonu, kapasite yönetimi, kullanıcı bilet geçmişi ve booking kodları.

## Goals

1. Kullanıcılar etkinliklere bilet "satın alabilmeli" (simülasyon)
2. Satın alma sırasında kapasite otomatik azalmalı
3. Bir kullanıcı aynı etkinliğe birden fazla bilet alabilmeli
4. Kullanıcılar kendi biletlerini görüntüleyebilmeli
5. Benzersiz booking kodları oluşturulmalı
6. Biletler iptal edilebilmeli (kapasite geri artmalı)
7. Organizer'lar etkinliklerinin tüm booking'lerini görebilmeli

## Design

### Booking Flow

```
User views Event Detail
  ↓
Clicks "Book Ticket" (authenticated users only)
  ↓
Select quantity (if available capacity allows)
  ↓
Confirm booking
  ↓
System:
  - Creates booking record
  - Generates unique booking code
  - Decreases event capacity (via trigger)
  - Shows confirmation
  ↓
User can view ticket in "My Tickets"
```

### Database Schema

RFC-001'de tanımlı:
- `bookings` table
- Auto-generate booking code trigger
- Auto-update capacity trigger

## Components & Pages

### 1. Book Event Button (Event Detail Page)

```typescript
// components/events/book-event-button.tsx

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Event } from "@/types/database";

interface BookEventButtonProps {
  event: Event;
  disabled?: boolean;
  isAuthenticated: boolean;
}

export function BookEventButton({
  event,
  disabled,
  isAuthenticated,
}: BookEventButtonProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const totalPrice = event.is_free ? 0 : event.ticket_price * quantity;

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to book tickets");
      router.push("/auth/login");
      return;
    }

    if (quantity > event.available_capacity) {
      toast.error("Not enough tickets available");
      return;
    }

    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.data?.user) throw new Error("Not authenticated");

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          event_id: event.id,
          user_id: user.data.user.id,
          quantity,
          total_price: totalPrice,
          status: "confirmed",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(
        `Successfully booked ${quantity} ticket${quantity > 1 ? "s" : ""}!`
      );
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Booking error:", error);
      if (error.message?.includes("Not enough capacity")) {
        toast.error("Sorry, not enough tickets available");
      } else {
        toast.error("Failed to book tickets. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button className="w-full" onClick={() => router.push("/auth/login")}>
        Login to Book Tickets
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={disabled}>
          Book Tickets
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book Tickets</DialogTitle>
          <DialogDescription>
            {event.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Tickets</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={Math.min(event.available_capacity, 10)}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            <p className="text-sm text-muted-foreground">
              {event.available_capacity} tickets available
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Price per ticket:</span>
              <span>{event.is_free ? "Free" : `$${event.ticket_price}`}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>{event.is_free ? "Free" : `$${totalPrice.toFixed(2)}`}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleBook} disabled={isLoading}>
            {isLoading ? "Booking..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. My Tickets Page

```typescript
// app/my-tickets/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketCard } from "@/components/bookings/ticket-card";

export default async function MyTicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get all bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      event:events(
        *,
        organization:organizations(name, slug)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Separate into upcoming and past
  const now = new Date();
  const upcomingBookings = bookings?.filter(
    (b) => new Date(b.event.start_date) > now && b.status === "confirmed"
  );
  const pastBookings = bookings?.filter(
    (b) => new Date(b.event.start_date) <= now || b.status === "cancelled"
  );

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">My Tickets</h1>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastBookings?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {!upcomingBookings || upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No upcoming tickets. Browse events to book tickets!
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map((booking) => (
              <TicketCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {!pastBookings || pastBookings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">No past tickets</p>
              </CardContent>
            </Card>
          ) : (
            pastBookings.map((booking) => (
              <TicketCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3. Ticket Card Component

```typescript
// components/bookings/ticket-card.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  MapPinIcon,
  TicketIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Booking, Event } from "@/types/database";

interface TicketCardProps {
  booking: Booking & {
    event: Event & { organization: { name: string; slug: string } };
  };
}

export function TicketCard({ booking }: TicketCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isPast = new Date(booking.event.start_date) < new Date();
  const isCancelled = booking.status === "cancelled";
  const canCancel = !isPast && !isCancelled;

  const handleCancel = async () => {
    setIsCancelling(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success("Booking cancelled successfully");
      setShowCancelDialog(false);
      router.refresh();
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Card className={isCancelled ? "opacity-60" : ""}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Event Info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/events/${booking.event.slug}`}
                    className="text-xl font-semibold hover:underline"
                  >
                    {booking.event.title}
                  </Link>
                  {isCancelled && (
                    <Badge variant="destructive">Cancelled</Badge>
                  )}
                  {isPast && !isCancelled && (
                    <Badge variant="secondary">Past Event</Badge>
                  )}
                </div>
                <Link
                  href={`/organizations/${booking.event.organization.slug}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  by {booking.event.organization.name}
                </Link>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(booking.event.start_date).toLocaleString()}
                  </span>
                </div>
                {booking.event.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <TicketIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Booking Info */}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Booking Code: <span className="font-mono font-semibold text-foreground">{booking.booking_code}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {booking.total_price === 0 ? "Free" : `$${booking.total_price}`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### 4. Event Bookings View (For Organizers)

```typescript
// components/organizations/organization-events-tab.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Event, Organization } from "@/types/database";
import { useEffect } from "react";

interface OrganizationEventsTabProps {
  organization: Organization;
  events: Event[];
}

export function OrganizationEventsTab({
  organization,
  events,
}: OrganizationEventsTabProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const loadBookings = async (eventId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        profile:profiles(fullname, email)
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setBookings(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedEvent) {
      loadBookings(selectedEvent);
    }
  }, [selectedEvent]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Events ({events.length})</h3>
        <Button asChild size="sm">
          <Link href={`/organizations/${organization.slug}/events/create`}>
            Create Event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No events yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isPast = new Date(event.end_date) < new Date();
            const isUpcoming = new Date(event.start_date) > new Date();

            return (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{event.title}</h4>
                        <Badge
                          variant={
                            event.status === "published"
                              ? "default"
                              : event.status === "draft"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {event.status}
                        </Badge>
                        {isPast && <Badge variant="secondary">Past</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(event.start_date).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          {event.available_capacity}/{event.total_capacity}{" "}
                          available
                        </span>
                        <span>
                          {event.is_free ? "Free" : `$${event.ticket_price}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEvent(event.id)}
                      >
                        View Bookings
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/events/${event.slug}`}>View Event</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bookings Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Bookings</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {isLoading ? (
              <p>Loading...</p>
            ) : bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">
                No bookings yet
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">
                            {booking.profile.fullname}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.profile.email}
                          </p>
                          <p className="text-sm mt-1">
                            Quantity: {booking.quantity}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Code: {booking.booking_code}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {booking.status}
                          </Badge>
                          <p className="text-sm mt-1">
                            ${booking.total_price}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## Helper Functions

```typescript
// lib/bookings/queries.ts

import { createClient } from "@/lib/supabase/client";

export async function getUserBookings(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      event:events(*, organization:organizations(*))
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getEventBookings(eventId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function hasUserBookedEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .single();

  return !error && !!data;
}
```

## API Routes (Optional)

```typescript
// app/api/bookings/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event_id, quantity } = body;

    // Validate quantity
    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check capacity
    if (event.available_capacity < quantity) {
      return NextResponse.json(
        { error: "Not enough tickets available" },
        { status: 400 }
      );
    }

    // Create booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        event_id,
        user_id: user.id,
        quantity,
        total_price: event.is_free ? 0 : event.ticket_price * quantity,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
```

## Testing Strategy

### Manual Testing

- [ ] User can book tickets for upcoming events
- [ ] Capacity decreases correctly
- [ ] Booking code is generated
- [ ] User can view their bookings
- [ ] User can cancel bookings
- [ ] Capacity increases after cancellation
- [ ] Organizers can view event bookings
- [ ] Cannot book more than available capacity
- [ ] Cannot book past events

### Unit Tests

```typescript
describe("Booking System", () => {
  test("calculates total price correctly", () => {
    const quantity = 3;
    const ticketPrice = 25.50;
    const total = quantity * ticketPrice;
    expect(total).toBe(76.50);
  });

  test("prevents booking with insufficient capacity", async () => {
    // Mock event with capacity 2
    // Try to book 3 tickets
    // Should fail
  });

  test("generates unique booking code", async () => {
    // Create multiple bookings
    // Verify all codes are unique
  });
});
```

## Open Questions

- [ ] QR code for tickets?
- [ ] Email confirmation after booking?
- [ ] Ticket transfer functionality?
- [ ] Refund policy?
- [ ] Booking history export?

## Approval

- [ ] Reviewed by: _________________
- [ ] Approved by: _________________
- [ ] Implementation Date: _________________
