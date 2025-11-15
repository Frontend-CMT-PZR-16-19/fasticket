import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DebugRawEventsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try to get events WITHOUT RLS (using service role if available)
  const { data: allEventsWithRLS, error: rlsError } = await supabase
    .from("events")
    .select("*");

  // Get organizations to check if they exist
  const { data: orgs, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name, status");

  // Get profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, fullname");

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Database Raw Debug</h1>

      {/* Current User */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p className="font-mono text-sm">ID: {user.id}</p>
              <p className="text-sm">Email: {user.email}</p>
              <Badge variant="default">Authenticated</Badge>
            </div>
          ) : (
            <Badge variant="secondary">Not Authenticated</Badge>
          )}
        </CardContent>
      </Card>

      {/* Organizations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Organizations ({orgs?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {orgsError && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded mb-4">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{orgsError.message}</p>
            </div>
          )}
          {orgs && orgs.length > 0 ? (
            <div className="space-y-2">
              {orgs.map((org) => (
                <div key={org.id} className="border rounded p-3">
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {org.id}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {org.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No organizations found</p>
          )}
        </CardContent>
      </Card>

      {/* Profiles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profiles ({profiles?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {profilesError && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded mb-4">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{profilesError.message}</p>
            </div>
          )}
          {profiles && profiles.length > 0 ? (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div key={profile.id} className="border rounded p-3">
                  <p className="font-semibold">
                    {profile.fullname || "No name"}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {profile.id}
                  </p>
                  {user?.id === profile.id && (
                    <Badge variant="default" className="mt-1">
                      You
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No profiles found</p>
          )}
        </CardContent>
      </Card>

      {/* Events with RLS */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Events (With RLS) ({allEventsWithRLS?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {rlsError && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded mb-4">
              <p className="font-semibold">RLS Error:</p>
              <p className="text-sm">{rlsError.message}</p>
              <pre className="text-xs mt-2 overflow-auto bg-muted p-2 rounded">
                {JSON.stringify(rlsError, null, 2)}
              </pre>
            </div>
          )}
          {allEventsWithRLS && allEventsWithRLS.length > 0 ? (
            <div className="space-y-3">
              {allEventsWithRLS.map((event: any) => (
                <div key={event.id} className="border rounded p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{event.title}</h3>
                    <Badge variant="outline">{event.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start:</p>
                      <p className="text-xs">{event.start_date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End:</p>
                      <p className="text-xs">{event.end_date}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t text-xs space-y-1">
                    <p className="text-muted-foreground">
                      Org ID: {event.organization_id}
                    </p>
                    <p className="text-muted-foreground">
                      Created by: {event.created_by}
                    </p>
                    <p className="text-muted-foreground">
                      Event ID: {event.id}
                    </p>
                    {user?.id === event.created_by && (
                      <Badge variant="default">Your Event</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-muted-foreground mb-2">
                No events found in database
              </p>
              <p className="text-sm text-muted-foreground">
                This means either:
              </p>
              <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto mt-2 space-y-1">
                <li>• No events exist in the database</li>
                <li>• All events are draft/cancelled and not created by you</li>
                <li>• RLS policy is blocking access</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Required */}
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="text-yellow-900 dark:text-yellow-100">
            Action Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-900 dark:text-yellow-100">
          <p className="font-semibold mb-4">
            To create a test event, please:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to Supabase Dashboard</li>
            <li>Open SQL Editor</li>
            <li>Run this query:</li>
          </ol>
          <pre className="mt-4 bg-white dark:bg-black p-4 rounded text-xs overflow-auto">
            {`-- Check if you have an organization
SELECT id, name FROM organizations WHERE created_by = '${user?.id}';

-- If you have an organization, create an event
INSERT INTO events (
  organization_id,
  title,
  slug,
  description,
  start_date,
  end_date,
  location,
  total_capacity,
  available_capacity,
  is_free,
  status,
  created_by
)
SELECT 
  id,
  'My First Event',
  'my-first-event',
  'This is a test event',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
  'Test Location',
  100,
  100,
  true,
  'published',
  '${user?.id}'
FROM organizations 
WHERE created_by = '${user?.id}'
LIMIT 1;`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
