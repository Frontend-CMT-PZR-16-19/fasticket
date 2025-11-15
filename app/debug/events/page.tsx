import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DebugEventsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get all events with their dates
  const { data: allEvents, error } = await supabase
    .from("events")
    .select("id, title, start_date, end_date, status, created_by")
    .order("start_date", { ascending: false });

  console.log("Debug Events - User:", user?.id);
  console.log("Debug Events - Error:", error);
  console.log("Debug Events - Data:", allEvents);

  const now = new Date();
  const nowISO = now.toISOString();

  // Categorize events
  const upcoming = allEvents?.filter(
    (e) => new Date(e.start_date) > now
  ) || [];
  const ongoing = allEvents?.filter(
    (e) => new Date(e.start_date) <= now && new Date(e.end_date) > now
  ) || [];
  const past = allEvents?.filter((e) => new Date(e.end_date) <= now) || [];

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Event Debug Page</h1>

      {/* User Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div>
              <p className="font-mono text-sm mb-2">ID: {user.id}</p>
              <p className="text-sm">Email: {user.email}</p>
              <Badge variant="default">Authenticated</Badge>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-2">Not logged in</p>
              <Badge variant="secondary">Anonymous</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                ⚠️ You can only see published events when not logged in
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Time */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Server Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-sm">{nowISO}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {now.toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            })}
          </p>
        </CardContent>
      </Card>

      {/* Event Counts */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcoming.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ongoing Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ongoing.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{past.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* All Events Detail */}
      <Card>
        <CardHeader>
          <CardTitle>All Events ({allEvents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded mb-4">
              <p className="font-semibold">Database Error:</p>
              <p className="text-sm">{error.message}</p>
              <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(error, null, 2)}</pre>
            </div>
          )}
          {allEvents && allEvents.length > 0 ? (
            <div className="space-y-4">
              {allEvents.map((event) => {
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);
                const isUpcoming = startDate > now;
                const isOngoing = startDate <= now && endDate > now;
                const isPast = endDate <= now;

                return (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline">{event.status}</Badge>
                        <Badge
                          variant={
                            isUpcoming
                              ? "default"
                              : isOngoing
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {isUpcoming
                            ? "Upcoming"
                            : isOngoing
                            ? "Ongoing"
                            : "Past"}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Date:</p>
                        <p className="font-mono text-xs">{event.start_date}</p>
                        <p className="text-xs">
                          {startDate.toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date:</p>
                        <p className="font-mono text-xs">{event.end_date}</p>
                        <p className="text-xs">
                          {endDate.toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                      <p>Status: {event.status}</p>
                      <p>Created by: {event.created_by}</p>
                      <p>ID: {event.id}</p>
                      {user?.id === event.created_by && (
                        <Badge variant="default" className="mt-1">
                          Your Event
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No events found in database
            </p>
          )}
        </CardContent>
      </Card>

      {/* SQL Query Examples */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>RLS Policy Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded">
            <p className="font-semibold mb-2">Current SELECT Policy:</p>
            <code className="text-xs block">
              status = 'published' OR created_by = auth.uid()
            </code>
          </div>
          <div className="text-sm space-y-2">
            <p>✅ You can see events if:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
              <li>Event status is "published", OR</li>
              <li>You are the creator of the event (logged in)</li>
            </ul>
            <p className="mt-3">❌ You cannot see events if:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
              <li>Event status is "draft" and you are not the creator</li>
              <li>Event status is "cancelled" and you are not the creator</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* SQL Query Examples */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Query Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold mb-2">Upcoming Filter:</p>
            <code className="text-xs bg-muted p-2 rounded block">
              .gt("start_date", "{nowISO}")
            </code>
          </div>
          <div>
            <p className="font-semibold mb-2">Ongoing Filter:</p>
            <code className="text-xs bg-muted p-2 rounded block">
              .lte("start_date", "{nowISO}").gt("end_date", "{nowISO}")
            </code>
          </div>
          <div>
            <p className="font-semibold mb-2">Past Filter:</p>
            <code className="text-xs bg-muted p-2 rounded block">
              .lte("end_date", "{nowISO}")
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
