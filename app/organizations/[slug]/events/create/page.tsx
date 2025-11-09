import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth/server-permissions";
import { CreateEventForm } from "@/components/events/create-event-form";

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
    title: `Create Event - ${organization.name} - Fasticket`,
    description: `Create a new event for ${organization.name}`,
  };
}

export default async function CreateEventPage({ params }: PageProps) {
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
    const user = await requireOrganizer(organization.id);
    
    return (
      <div className="container max-w-4xl py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Event</h1>
          <p className="text-muted-foreground">
            Create a new event for {organization.name}
          </p>
        </div>
        <CreateEventForm organization={organization} userId={user.id} />
      </div>
    );
  } catch {
    redirect("/unauthorized");
  }
}
