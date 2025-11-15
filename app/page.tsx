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
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Amazing Events Near You
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Book tickets for concerts, conferences, workshops, and more. Join amazing events or create your own!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/events">Browse Events</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/sign-up">Sign Up Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <p className="text-muted-foreground">
                Don't miss out on these amazing events
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/events">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredEvents && featuredEvents.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No upcoming events at the moment. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Featured Organizations */}
      {featuredOrgs && featuredOrgs.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Featured Organizations</h2>
              <p className="text-muted-foreground">
                Discover amazing event organizers
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Fasticket?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
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
      <section className="py-16">
        <div className="container">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Join thousands of event organizers and attendees on Fasticket
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth/sign-up">Sign Up Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

