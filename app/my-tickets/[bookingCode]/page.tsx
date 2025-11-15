import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import Link from "next/link";
import { Calendar, MapPin, Building2, Ticket, Users, CheckCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ bookingCode: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { bookingCode } = await params;
  
  return {
    title: `Ticket ${bookingCode} - Fasticket`,
    description: "Your ticket confirmation",
  };
}

export default async function TicketConfirmationPage({ params }: PageProps) {
  const { bookingCode } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get booking with event and organization details
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      *,
      event:events(
        *,
        organization:organizations(*)
      )
    `)
    .eq("booking_code", bookingCode)
    .eq("user_id", user.id)
    .single();

  if (error || !booking) {
    notFound();
  }

  const event = booking.event;
  const startDate = new Date(event.start_date);
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="container max-w-3xl py-10">
      {/* Success Message */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {isCancelled ? "Ticket Cancelled" : "Ticket Confirmed!"}
        </h1>
        <p className="text-muted-foreground">
          {isCancelled
            ? "This ticket has been cancelled"
            : "Your tickets have been successfully booked"}
        </p>
      </div>

      {/* Booking Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
              <Link
                href={`/organizations/${event.organization.slug}`}
                className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
              >
                <Building2 className="h-4 w-4" />
                {event.organization.name}
              </Link>
            </div>
            <Badge variant={isCancelled ? "destructive" : "default"} className="text-lg px-4 py-2">
              {isCancelled ? "Cancelled" : "Confirmed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {startDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {startDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  {event.venue_name && (
                    <p className="text-sm font-medium">{event.venue_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Booking Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Ticket className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Booking Code</p>
                <p className="text-2xl font-mono font-bold tracking-wider">
                  {booking.booking_code}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Number of Tickets</p>
                <p className="text-sm text-muted-foreground">
                  {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Price */}
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold">Total Price</span>
            <span className="text-2xl font-bold">
              {event.is_free ? "Free" : `$${booking.total_price.toFixed(2)}`}
            </span>
          </div>

          {/* Booking Date */}
          <p className="text-xs text-muted-foreground text-center">
            Booked on{" "}
            {new Date(booking.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/my-tickets">View All My Tickets</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/events/${event.slug}`}>View Event Details</Link>
        </Button>
        {!isCancelled && (
          <CancelBookingButton
            bookingId={booking.id}
            bookingCode={booking.booking_code}
            eventTitle={event.title}
            quantity={booking.quantity}
          />
        )}
      </div>

      {/* Instructions */}
      {!isCancelled && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Please save this booking code: <strong className="font-mono">{booking.booking_code}</strong>
            </p>
            <p>
              • Present this code at the event entrance for check-in
            </p>
            <p>
              • You can view this ticket anytime in "My Tickets" section
            </p>
            <p>
              • If you need to cancel, please do so at least 24 hours before the event
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
