# RFC-005: Event Management System

**Status**: Draft  
**Created**: 8 Kasım 2025  
**Author**: GitHub Copilot  
**Related**: RFC-001, RFC-002, RFC-004, RFC-006

## Abstract

Bu RFC, etkinlik yönetim sistemini detaylandırır: etkinlik oluşturma, düzenleme, listeleme, filtreleme (gelecek/geçmiş/devam eden), ve public/private etkinlik görüntüleme sayfalarını içerir.

## Goals

1. Organizer'lar organizasyonları için etkinlik oluşturabilmeli
2. Etkinlikler draft veya published status'ünde olabilmeli
3. Etkinlikler ücretsiz veya ücretli olabilmeli
4. Kapasite yönetimi olmalı
5. Public event listing (tüm published events)
6. Filtreleme: Upcoming, Ongoing, Past events
7. Event detail sayfası (public)
8. Event management sayfası (organizers only)

## Design

### Event States & Lifecycle

```
Draft Event
  ↓ (organizer publishes)
Upcoming Event (start_date > now)
  ↓ (start_date arrives)
Ongoing Event (start_date <= now <= end_date)
  ↓ (end_date passes)
Past Event (end_date < now)

Can be cancelled at any time → Cancelled Event
```

### Event Status Types

RFC-001'de tanımlı:
- `draft`: Not published, only visible to organizers
- `published`: Public, visible to everyone
- `cancelled`: Event cancelled

### Event Filtering

#### Upcoming Events
```sql
WHERE status = 'published' AND start_date > NOW()
```

#### Ongoing Events
```sql
WHERE status = 'published' 
  AND start_date <= NOW() 
  AND end_date > NOW()
```

#### Past Events
```sql
WHERE status = 'published' AND end_date <= NOW()
```

## Components & Pages

### 1. Public Events Listing Page

```typescript
// app/events/page.tsx

import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  searchParams: {
    filter?: "upcoming" | "ongoing" | "past";
    search?: string;
  };
}

export default async function EventsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const filter = searchParams.filter || "upcoming";
  const search = searchParams.search || "";

  let query = supabase
    .from("events")
    .select(`
      *,
      organization:organizations(id, name, slug, logo_url)
    `)
    .eq("status", "published");

  // Apply time filters
  const now = new Date().toISOString();
  if (filter === "upcoming") {
    query = query.gt("start_date", now);
  } else if (filter === "ongoing") {
    query = query.lte("start_date", now).gt("end_date", now);
  } else if (filter === "past") {
    query = query.lte("end_date", now);
  }

  // Apply search filter
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  query = query.order("start_date", {
    ascending: filter !== "past",
  });

  const { data: events, error } = await query;

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Discover Events</h1>
          <p className="text-muted-foreground">
            Find amazing events happening near you
          </p>
        </div>
      </div>

      <EventFilters currentFilter={filter} searchQuery={search} />

      {error && (
        <div className="text-center py-10">
          <p className="text-destructive">Failed to load events</p>
        </div>
      )}

      {!error && events && events.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No events found</p>
        </div>
      )}

      {!error && events && events.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. Event Filters Component

```typescript
// components/events/event-filters.tsx

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface EventFiltersProps {
  currentFilter: "upcoming" | "ongoing" | "past";
  searchQuery: string;
}

export function EventFilters({ currentFilter, searchQuery }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    router.push(`/events?${params.toString()}`);
  }, [debouncedSearch]);

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", value);
    router.push(`/events?${params.toString()}`);
  };

  return (
    <div className="mb-6 space-y-4">
      <Input
        type="search"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Tabs value={currentFilter} onValueChange={handleFilterChange}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
```

### 3. Event Card Component

```typescript
// components/events/event-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import type { Event, Organization } from "@/types/database";

interface EventCardProps {
  event: Event & { organization: Organization };
}

export function EventCard({ event }: EventCardProps) {
  const availabilityPercentage =
    (event.available_capacity / event.total_capacity) * 100;

  const getAvailabilityBadge = () => {
    if (availabilityPercentage === 0) {
      return <Badge variant="destructive">Sold Out</Badge>;
    } else if (availabilityPercentage < 20) {
      return <Badge variant="warning">Few Tickets Left</Badge>;
    } else {
      return <Badge variant="secondary">Available</Badge>;
    }
  };

  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="hover:shadow-lg transition-shadow h-full">
        {event.cover_image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">
              {event.title}
            </CardTitle>
            {event.is_free ? (
              <Badge>Free</Badge>
            ) : (
              <Badge>${event.ticket_price}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            by {event.organization.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(event.start_date).toLocaleDateString()}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              <span>
                {event.available_capacity}/{event.total_capacity} available
              </span>
            </div>
            {getAvailabilityBadge()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 4. Event Detail Page (Public)

```typescript
// app/events/[slug]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { BookEventButton } from "@/components/events/book-event-button";

interface PageProps {
  params: { slug: string };
}

export default async function EventDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get event
  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("slug", params.slug)
    .single();

  if (error || !event || event.status !== "published") {
    notFound();
  }

  // Check if user already booked
  let userBooking = null;
  if (user) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .single();
    userBooking = data;
  }

  const isUpcoming = new Date(event.start_date) > new Date();
  const isPast = new Date(event.end_date) < new Date();
  const isOngoing =
    new Date(event.start_date) <= new Date() &&
    new Date(event.end_date) > new Date();
  const isSoldOut = event.available_capacity === 0;

  return (
    <div className="container max-w-4xl py-10">
      {event.cover_image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-lg mb-6">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-start gap-2 mb-2">
              <h1 className="text-4xl font-bold flex-1">{event.title}</h1>
              {isOngoing && <Badge variant="default">Ongoing</Badge>}
              {isPast && <Badge variant="secondary">Past Event</Badge>}
            </div>
            <Link
              href={`/organizations/${event.organization.slug}`}
              className="text-muted-foreground hover:underline"
            >
              by {event.organization.name}
            </Link>
          </div>

          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{event.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.start_date).toLocaleString()} -{" "}
                    {new Date(event.end_date).toLocaleString()}
                  </p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {event.venue_name && <span>{event.venue_name}<br /></span>}
                      {event.location}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="md:w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">
                  {event.is_free ? "Free" : `$${event.ticket_price}`}
                </p>
                <p className="text-sm text-muted-foreground">per ticket</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-semibold">
                    {event.available_capacity} / {event.total_capacity}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{
                      width: `${
                        (event.available_capacity / event.total_capacity) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {userBooking ? (
                <div className="space-y-2">
                  <Badge className="w-full justify-center py-2">
                    You're Registered!
                  </Badge>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/my-tickets">View My Tickets</Link>
                  </Button>
                </div>
              ) : (
                <BookEventButton
                  event={event}
                  disabled={isSoldOut || isPast || !isUpcoming}
                  isAuthenticated={!!user}
                />
              )}

              {isSoldOut && (
                <p className="text-sm text-destructive text-center">
                  This event is sold out
                </p>
              )}
              {isPast && (
                <p className="text-sm text-muted-foreground text-center">
                  This event has ended
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organized by</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/organizations/${event.organization.slug}`}
                className="hover:underline"
              >
                <p className="font-semibold">{event.organization.name}</p>
                {event.organization.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                    {event.organization.description}
                  </p>
                )}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### 5. Create Event Page (Organizers Only)

```typescript
// app/organizations/[slug]/events/create/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth/server-permissions";
import { CreateEventForm } from "@/components/events/create-event-form";

interface PageProps {
  params: { slug: string };
}

export default async function CreateEventPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!organization) {
    notFound();
  }

  try {
    await requireOrganizer(organization.id);
  } catch {
    redirect("/unauthorized");
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-2">Create Event</h1>
      <p className="text-muted-foreground mb-6">
        Create a new event for {organization.name}
      </p>
      <CreateEventForm organization={organization} />
    </div>
  );
}
```

### 6. Create Event Form

```typescript
// components/events/create-event-form.tsx

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Organization } from "@/types/database";

interface CreateEventFormProps {
  organization: Organization;
}

export function CreateEventForm({ organization }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [venueName, setVenueName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalCapacity, setTotalCapacity] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [ticketPrice, setTicketPrice] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const slug = generateSlug(title);

    // Validation
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date");
      setIsLoading(false);
      return;
    }

    if (!isFree && (!ticketPrice || parseFloat(ticketPrice) <= 0)) {
      toast.error("Please enter a valid ticket price");
      setIsLoading(false);
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.data?.user) throw new Error("Not authenticated");

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          organization_id: organization.id,
          title,
          slug,
          description: description || null,
          location: location || null,
          venue_name: venueName || null,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          total_capacity: parseInt(totalCapacity),
          available_capacity: parseInt(totalCapacity),
          is_free: isFree,
          ticket_price: isFree ? 0 : parseFloat(ticketPrice),
          status: isDraft ? "draft" : "published",
          created_by: user.data.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(
        isDraft ? "Event saved as draft!" : "Event published successfully!"
      );
      router.push(`/organizations/${organization.slug}/manage?tab=events`);
      router.refresh();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Amazing Event"
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people about your event..."
                rows={5}
                maxLength={2000}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold">Location</h3>
            
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name</Label>
              <Input
                id="venueName"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Convention Center"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Address *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="123 Main St, City, State"
                required
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="font-semibold">Date & Time</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="space-y-4">
            <h3 className="font-semibold">Tickets</h3>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Total Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(e.target.value)}
                placeholder="100"
                required
                min="1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Free Event</Label>
                <p className="text-sm text-muted-foreground">
                  This event is free to attend
                </p>
              </div>
              <Switch checked={isFree} onCheckedChange={setIsFree} />
            </div>

            {!isFree && (
              <div className="space-y-2">
                <Label htmlFor="price">Ticket Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="25.00"
                  required={!isFree}
                  min="0.01"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Save as Draft</Label>
              <p className="text-sm text-muted-foreground">
                Draft events are not visible to the public
              </p>
            </div>
            <Switch checked={isDraft} onCheckedChange={setIsDraft} />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Creating..."
                : isDraft
                ? "Save as Draft"
                : "Publish Event"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Helper Functions

```typescript
// lib/events/queries.ts

import { createClient } from "@/lib/supabase/client";

export async function getUpcomingEvents(limit?: number) {
  const supabase = createClient();
  
  let query = supabase
    .from("events")
    .select(`*, organization:organizations(*)`)
    .eq("status", "published")
    .gt("start_date", new Date().toISOString())
    .order("start_date", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getEventBySlug(slug: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("events")
    .select(`*, organization:organizations(*)`)
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}
```

## Open Questions

- [ ] Event categories/tags?
- [ ] Cover image upload?
- [ ] Recurring events?
- [ ] Early bird pricing?
- [ ] Event check-in system?

## Approval

- [ ] Reviewed by: _________________
- [ ] Approved by: _________________
- [ ] Implementation Date: _________________
