import { createClient } from "@/lib/supabase/server";
<<<<<<< HEAD
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  // Get current user
=======
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Settings, Users, Calendar, MapPin, DollarSign } from "lucide-react";
import { getUserRoleInOrganization } from "@/lib/auth/permissions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function OrganizationPage({ params }: PageProps) {
  const supabase = await createClient();
  
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e
  const {
    data: { user },
  } = await supabase.auth.getUser();

<<<<<<< HEAD
  // Fetch organization with creator and members
  const { data: organization, error } = await supabase
    .from("organizations")
    .select(
      `
      *,
      creator:profiles!organizations_created_by_fkey(id, fullname, avatar_url),
      organization_members(
        id,
        role,
        joined_at,
        profiles!organization_members_user_id_fkey(id, fullname, avatar_url)
      )
    `
    )
    .eq("slug", slug)
=======
  // Get organization by slug
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", params.slug)
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e
    .single();

  if (error || !organization) {
    notFound();
  }

<<<<<<< HEAD
  // Check if current user is an organizer
  const isOrganizer =
    user &&
    organization.organization_members.some(
      (member: any) => member.profiles.id === user.id && member.role === "organizer"
    );

  // Fetch events for this organization
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("organization_id", organization.id)
    .order("start_date", { ascending: true });

  const upcomingEvents =
    events?.filter(
      (e) => e.status === "published" && new Date(e.end_date) > new Date()
    ) || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <Link
        href="/organizations"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Organizations
      </Link>

      {/* Organization Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={organization.logo_url || undefined} />
              <AvatarFallback className="text-2xl">
                {organization.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
              <p className="text-muted-foreground">
                {organization.description || "No description provided"}
              </p>
            </div>
          </div>
          {isOrganizer && (
            <div className="flex gap-2">
              <Link href={`/organizations/${slug}/events/create`}>
                <Button>Create Event</Button>
              </Link>
              <Link href={`/organizations/${slug}/manage`}>
                <Button variant="outline">Manage</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{organization.organization_members.length} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Created{" "}
              {new Date(organization.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          {isOrganizer && upcomingEvents.length > 0 && (
            <Link href={`/organizations/${slug}/events/create`}>
              <Button size="sm">Create Event</Button>
            </Link>
          )}
        </div>

        {upcomingEvents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
              <p className="text-muted-foreground mb-4">
                {isOrganizer
                  ? "Create your first event to get started!"
                  : "Check back later for new events."}
              </p>
              {isOrganizer && (
                <Link href={`/organizations/${slug}/events/create`}>
                  <Button>Create First Event</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => {
              const startDate = new Date(event.start_date);
              return (
                <Link key={event.id} href={`/events/${event.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {event.cover_image_url && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={event.cover_image_url}
                          alt={event.title}
                          className="object-cover w-full h-full"
=======
  // Get user's role if logged in
  let userRole = null;
  if (user) {
    userRole = await getUserRoleInOrganization(user.id, organization.id);
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  // Get events count
  const { count: eventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    .eq("status", "published");

  // Get upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("status", "published")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(3);

  const isOrganizer = userRole === "organizer";

  return (
    <div className="container py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{organization.name}</h1>
              <p className="text-muted-foreground mt-1">
                {organization.description || "No description provided"}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline">
                  <Users className="mr-1 h-3 w-3" />
                  {memberCount || 0} members
                </Badge>
                <Badge variant="outline">
                  <Calendar className="mr-1 h-3 w-3" />
                  {eventsCount || 0} events
                </Badge>
              </div>
            </div>
          </div>

          {isOrganizer && (
            <Button asChild variant="outline">
              <Link href={`/organizations/${params.slug}/manage`}>
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </Link>
            </Button>
          )}
        </div>

        {/* Quick Actions for Organizers */}
        {isOrganizer && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your organization</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button asChild>
                <Link href={`/organizations/${params.slug}/events/create`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/organizations/${params.slug}/manage`}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Members
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Events Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Yaklaşan Etkinlikler</h2>
            <Button asChild variant="outline" size="sm">
              <Link href={`/organizations/${params.slug}/events`}>
                Tümünü Gör
              </Link>
            </Button>
          </div>

          {!upcomingEvents || upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Henüz etkinlik yok</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {isOrganizer
                    ? "İlk etkinliğinizi oluşturarak başlayın"
                    : "Yakında yeni etkinlikler eklenecek"}
                </p>
                {isOrganizer && (
                  <Button asChild>
                    <Link href={`/organizations/${params.slug}/events/create`}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Etkinlik Oluştur
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.event_date);
                const isFree = event.ticket_price === 0;
                const isSoldOut = event.available_capacity === 0;

                return (
                  <Card key={event.id} className="flex flex-col">
                    {event.image_url && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={event.image_url}
                          alt={event.name}
                          className="h-full w-full object-cover"
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e
                        />
                      </div>
                    )}
                    <CardHeader>
<<<<<<< HEAD
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="line-clamp-2">
                          {event.title}
                        </CardTitle>
                        <Badge
                          variant={
                            event.status === "published"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {event.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {startDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Members</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {organization.organization_members.map((member: any) => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarImage src={member.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.profiles.fullname
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold mb-1">{member.profiles.fullname}</h3>
                  <Badge variant={member.role === "organizer" ? "default" : "secondary"}>
                    {member.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
=======
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2">{event.name}</CardTitle>
                        {isSoldOut && (
                          <Badge variant="destructive">Tükendi</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1">
                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(eventDate, "d MMMM yyyy, HH:mm", { locale: tr })}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>

                      {/* Capacity */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.available_capacity} / {event.capacity} kişi
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {isFree ? "ÜCRETSİZ" : `${event.ticket_price.toFixed(2)} ₺`}
                        </span>
                      </div>
                    </CardContent>
                    <CardContent className="pt-0">
                      <Button asChild className="w-full" disabled={isSoldOut}>
                        <Link href={`/events/${event.id}`}>
                          {isSoldOut ? "Tükendi" : "Detayları Gör"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e
        </div>
      </div>
    </div>
  );
}
