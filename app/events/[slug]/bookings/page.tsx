import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth/server-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Users, DollarSign, Ticket } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    return { title: "Event Not Found" };
  }

  return {
    title: `Manage Bookings - ${event.title} - Fasticket`,
    description: `Manage bookings for ${event.title}`,
  };
}

export default async function EventBookingsPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get event with organization
  const { data: event } = await supabase
    .from("events")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("slug", slug)
    .single();

  if (!event) {
    notFound();
  }

  // Verify user is organizer
  try {
    await requireOrganizer(event.organization_id);
  } catch {
    redirect("/unauthorized");
  }

  // Get all bookings for this event
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      user:profiles(fullname, avatar_url)
    `)
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const allBookings = bookings || [];
  const confirmedBookings = allBookings.filter((b) => b.status === "confirmed");
  const cancelledBookings = allBookings.filter((b) => b.status === "cancelled");

  const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.quantity, 0);
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="container max-w-6xl mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/organizations/${event.organization.slug}/manage`}
          className="text-sm text-muted-foreground hover:underline mb-2 inline-block"
        >
          ← Back to Organization
        </Link>
        <h1 className="text-3xl font-bold mb-2">Booking Management</h1>
        <p className="text-muted-foreground">{event.title}</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allBookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalTicketsSold} tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.is_free ? "Free Event" : `$${totalRevenue.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.available_capacity}/{event.total_capacity}
            </div>
            <p className="text-xs text-muted-foreground">available</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            View all bookings for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allBookings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No bookings yet
            </div>
          ) : (
            <div className="space-y-4">
              {allBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{booking.user.fullname}</p>
                      <Badge variant={booking.status === "confirmed" ? "default" : "destructive"}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Code: <span className="font-mono">{booking.booking_code}</span></span>
                      <span>{booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}</span>
                      <span>
                        {new Date(booking.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {event.is_free ? "Free" : `$${booking.total_price.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href={`/events/${event.slug}`}>View Event Page</Link>
        </Button>
      </div>
    </div>
  );
}
