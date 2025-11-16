import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { ArrowRight, Ticket, Building2, Calendar } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  // Get featured upcoming events
  const { data: featuredEvents } = await supabase
    .from("events")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("status", "published")
    .gt("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(6);

  // Get active organizations
  const { data: featuredOrgs } = await supabase
    .from("organizations")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-primary/10 via-amber-50/50 to-background dark:from-primary/5 dark:via-background dark:to-background py-20 md:py-28">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Discover Amazing{" "}
              <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                Events
              </span>{" "}
              Near You
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Book tickets for concerts, conferences, workshops, and more. Join amazing events or create your own!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-base">
                <Link href="/events">
                  Browse Events
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="/auth/sign-up">Sign Up Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold">Upcoming Events</h2>
              <p className="text-muted-foreground text-lg">
                Don't miss out on these amazing events
              </p>
            </div>
            <Button asChild variant="outline" className="hidden sm:flex">
              <Link href="/events">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredEvents && featuredEvents.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  No upcoming events at the moment. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Featured Organizations */}
      {featuredOrgs && featuredOrgs.length > 0 && (
        <section className="w-full py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold">Featured Organizations</h2>
              <p className="text-muted-foreground text-lg">
                Discover amazing event organizers
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
              {featuredOrgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/organizations/${org.slug}`}
                  className="group"
                >
                  <Card className="transition-all hover:shadow-lg">
                    <CardHeader className="text-center">
                      {org.logo_url ? (
                        <div className="mx-auto mb-4 h-20 w-20 rounded-full overflow-hidden border-2 border-primary/10">
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-primary" />
                        </div>
                      )}
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {org.name}
                      </CardTitle>
                    </CardHeader>
                    {org.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 text-center">
                          {org.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Choose Fasticket?
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            Everything you need to discover, book, and manage events
          </p>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Easy Booking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Book tickets for your favorite events in just a few clicks.
                  Simple, fast, and secure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Organize Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create your organization and start hosting events. Manage
                  everything in one place.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Track Bookings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep track of all your bookings and tickets. Never miss an
                  event again.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/10 via-amber-50/30 to-background dark:from-primary/5 dark:to-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary to-amber-500 text-white border-0 shadow-2xl">
            <CardContent className="py-16 px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg md:text-xl mb-8 opacity-95 max-w-2xl mx-auto">
                Join thousands of event organizers and attendees on Fasticket
              </p>
              <Button asChild size="lg" variant="secondary" className="text-base shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/auth/sign-up">
                  Sign Up Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

