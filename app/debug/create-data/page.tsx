"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateTestDataPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  const createTestOrganization = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please login first");
        return;
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: "Test Organization " + Math.floor(Math.random() * 1000),
          slug: "test-org-" + Math.floor(Math.random() * 10000),
          description: "This is a test organization for demo purposes",
          status: "active",
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      toast.success("Organization created!");
      setResults({ organization: org });
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestEvents = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please login first");
        return;
      }

      // Get user's organizations
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .eq("created_by", userData.user.id)
        .limit(1);

      if (!orgs || orgs.length === 0) {
        toast.error("Please create an organization first");
        return;
      }

      const orgId = orgs[0].id;

      // Create upcoming event
      const { data: event1, error: error1 } = await supabase
        .from("events")
        .insert({
          organization_id: orgId,
          title: "Tech Conference 2025",
          slug: "tech-conference-2025-" + Math.floor(Math.random() * 1000),
          description: "An amazing tech conference with industry leaders",
          start_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          end_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000
          ).toISOString(),
          location: "Istanbul Convention Center",
          venue_name: "ICC Hall A",
          total_capacity: 500,
          available_capacity: 500,
          ticket_price: 0,
          is_free: true,
          status: "published",
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error1) throw error1;

      // Create another upcoming event
      const { data: event2, error: error2 } = await supabase
        .from("events")
        .insert({
          organization_id: orgId,
          title: "Startup Meetup",
          slug: "startup-meetup-" + Math.floor(Math.random() * 1000),
          description: "Monthly startup networking event",
          start_date: new Date(
            Date.now() + 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
          end_date: new Date(
            Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
          ).toISOString(),
          location: "Tech Hub Ankara",
          venue_name: "Main Hall",
          total_capacity: 100,
          available_capacity: 100,
          ticket_price: 25.0,
          is_free: false,
          status: "published",
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error2) throw error2;

      // Create a past event
      const { data: event3, error: error3 } = await supabase
        .from("events")
        .insert({
          organization_id: orgId,
          title: "Past Workshop 2024",
          slug: "past-workshop-2024-" + Math.floor(Math.random() * 1000),
          description: "This was a great workshop that happened last year",
          start_date: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          end_date: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
          ).toISOString(),
          location: "Izmir Tech Park",
          venue_name: "Room 101",
          total_capacity: 50,
          available_capacity: 0,
          ticket_price: 0,
          is_free: true,
          status: "published",
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error3) throw error3;

      toast.success("3 events created successfully!");
      setResults({ event1, event2, event3 });
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8">Create Test Data</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              First, create a test organization to host events.
            </p>
            <Button onClick={createTestOrganization} disabled={loading}>
              {loading ? "Creating..." : "Create Test Organization"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Create Test Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This will create 3 events:
            </p>
            <ul className="text-sm text-muted-foreground mb-4 list-disc list-inside">
              <li>Tech Conference (30 days from now - Upcoming)</li>
              <li>Startup Meetup (10 days from now - Upcoming)</li>
              <li>Past Workshop (30 days ago - Past)</li>
            </ul>
            <Button onClick={createTestEvents} disabled={loading}>
              {loading ? "Creating..." : "Create Test Events"}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <Card className="bg-green-50 dark:bg-green-950 border-green-500">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                Success!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-white dark:bg-black p-4 rounded">
                {JSON.stringify(results, null, 2)}
              </pre>
              <div className="mt-4 space-x-2">
                <Button asChild variant="default">
                  <a href="/events">View Events</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/debug/events">Debug Events</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
