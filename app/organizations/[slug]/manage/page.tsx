import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth/server-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationMembersTab } from "@/components/organizations/organization-members-tab";
import { OrganizationEventsTab } from "@/components/organizations/organization-events-tab";
import { OrganizationSettingsTab } from "@/components/organizations/organization-settings-tab";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  if (!organization) {
    return { title: "Organization Not Found" };
  }

  return {
    title: `Manage ${organization.name} - Fasticket`,
    description: `Manage settings, members, and events for ${organization.name}`,
  };
}

export default async function OrganizationManagePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get organization
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!organization) {
    notFound();
  }

  // Verify user is organizer
  try {
    await requireOrganizer(organization.id);
  } catch {
    redirect("/unauthorized");
  }

  // Get members
  const { data: members } = await supabase
    .from("organization_members")
    .select(
      `
      *,
      profile:profiles(id, fullname, avatar_url)
    `
    )
    .eq("organization_id", organization.id)
    .order("joined_at", { ascending: false });

  // Get events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("organization_id", organization.id)
    .order("start_date", { ascending: false });

  return (
    <div className="container max-w-6xl py-10">
      <h1 className="text-3xl font-bold mb-6">Manage {organization.name}</h1>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <OrganizationMembersTab
            organization={organization}
            members={members || []}
          />
        </TabsContent>

        <TabsContent value="events">
          <OrganizationEventsTab
            organization={organization}
            events={events || []}
          />
        </TabsContent>

        <TabsContent value="settings">
          <OrganizationSettingsTab organization={organization} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
