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

  // Get upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(6);

  // Get member count
  const { count: memberCount } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  // Check if user is organizer
  const userIsOrganizer = user ? await isOrganizer(organization.id) : false;

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{organization.name}</h1>
          {organization.description && (
            <p className="text-lg text-muted-foreground max-w-3xl">
              {organization.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCount} {memberCount === 1 ? "Member" : "Members"}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {upcomingEvents?.length || 0} Upcoming Events
            </Badge>
          </div>
        </div>
        {userIsOrganizer && (
          <Button asChild>
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
  );
}
