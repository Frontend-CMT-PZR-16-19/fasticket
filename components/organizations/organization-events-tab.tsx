"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Organization, Event } from "@/types/database";
import { Calendar, MapPin, Users, Plus } from "lucide-react";

interface OrganizationEventsTabProps {
  organization: Organization;
  events: Event[];
}

export function OrganizationEventsTab({
  organization,
  events,
}: OrganizationEventsTabProps) {
  const now = new Date();
  const upcomingEvents = events.filter(
    (e) => new Date(e.start_date) > now && e.status === "published"
  );
  const draftEvents = events.filter((e) => e.status === "draft");
  const pastEvents = events.filter(
    (e) => new Date(e.end_date) < now && e.status === "published"
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftEvents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Past Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastEvents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Event Button */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Start planning your next event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/organizations/${organization.slug}/events/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events happening soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} organization={organization} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft Events */}
      {draftEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Draft Events</CardTitle>
            <CardDescription>Unpublished events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {draftEvents.map((event) => (
                <EventCard key={event.id} event={event} organization={organization} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
            <CardDescription>Completed events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastEvents.slice(0, 5).map((event) => (
                <EventCard key={event.id} event={event} organization={organization} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {events.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No events yet</p>
            <p className="text-muted-foreground mb-4">
              Create your first event to get started
            </p>
            <Button asChild>
              <Link href={`/organizations/${organization.slug}/events/create`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EventCard({
  event,
  organization,
}: {
  event: Event;
  organization: Organization;
}) {
  return (
    <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold">{event.title}</h3>
          <Badge variant={event.status === "draft" ? "outline" : "default"}>
            {event.status}
          </Badge>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(event.start_date).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.location}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {event.available_capacity} / {event.total_capacity} tickets available
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${event.slug}`}>View</Link>
        </Button>
        <Button asChild variant="outline" size="sm" disabled>
          Edit
        </Button>
      </div>
    </div>
  );
}
