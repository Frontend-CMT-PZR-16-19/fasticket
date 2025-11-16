import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { isOrganizer } from "@/lib/auth/server-permissions";
import { Calendar, Users } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("name, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!organization) {
    return { title: "Organization Not Found" };
  }

  return {
    title: `${organization.name} - Fasticket`,
    description: organization.description || `Events by ${organization.name}`,
  };
}

export default async function OrganizationPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get organization
  const { data: organization, error } = await supabase
    .from("organizations")
    .select(
      `
      *,
      creator:profiles!created_by(fullname, avatar_url)
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !organization) {
    notFound();
  }

  // Get upcoming events - temporarily remove status filter for debugging
  const { data: upcomingEvents, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("organization_id", organization.id)
    // .eq("status", "published")  // Temporarily commented for debugging
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(6);

  // Debug logging
  console.log("=== Organization Events Debug ===");
  console.log("Organization ID:", organization.id);
  console.log("Current time:", new Date().toISOString());
  console.log("Events error:", eventsError);
  console.log("Events found:", upcomingEvents?.length || 0);
  if (upcomingEvents && upcomingEvents.length > 0) {
    console.log("Sample event:", {
      title: upcomingEvents[0].title,
      status: upcomingEvents[0].status,
      start_date: upcomingEvents[0].start_date,
      is_future: new Date(upcomingEvents[0].start_date) > new Date(),
    });
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  // Check if user is organizer
  const userIsOrganizer = user ? await isOrganizer(organization.id) : false;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-10">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">{organization.name}</h1>
            {organization.description && (
              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                {organization.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {memberCount} {memberCount === 1 ? "Member" : "Members"}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {upcomingEvents?.length || 0} Upcoming Events
              </Badge>
            </div>
          </div>
          {userIsOrganizer && (
            <Button asChild size="lg">
              <Link href={`/organizations/${slug}/manage`}>
              Manage Organization
            </Link>
          </Button>
        )}
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Events</CardTitle>
          {userIsOrganizer && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/organizations/${slug}/events/create`}>
                Create Event
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!upcomingEvents || upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming events
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    {event.cover_image_url && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={event.cover_image_url}
                          alt={event.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(event.start_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <Badge>
                        {event.is_free ? "Free" : `$${event.ticket_price}`}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
