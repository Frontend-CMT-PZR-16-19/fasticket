"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, MapPin, Users, Building2 } from "lucide-react";
import type { Event, Organization } from "@/types/database";

interface EventCardProps {
  event: Event & {
    organization: Organization;
  };
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_date);
  const isUpcoming = startDate > new Date();
  const availabilityPercent =
    (event.available_capacity / event.total_capacity) * 100;

  return (
    <Link href={`/events/${event.slug}`} className="block h-full">
      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
        {event.cover_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="object-cover w-full h-full hover:scale-105 transition-transform"
            />
          </div>
        )}
        <CardHeader className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
            {isUpcoming && (
              <Badge
                variant={availabilityPercent > 20 ? "default" : "destructive"}
                className="shrink-0"
              >
                {event.is_free ? "Free" : `$${event.ticket_price}`}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{event.organization.name}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {startDate.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {event.available_capacity === 0
                ? "Sold Out"
                : `${event.available_capacity} tickets available`}
            </span>
          </div>

          {availabilityPercent <= 20 && availabilityPercent > 0 && (
            <Badge variant="outline" className="text-xs">
              Only {event.available_capacity} left!
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
