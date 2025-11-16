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
      <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="mb-10 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">Create Event</h1>
            <p className="text-muted-foreground text-lg">
              Create a new event for {organization.name}
            </p>
          </div>
          <CreateEventForm organization={organization} userId={user.id} />
        </div>
      </div>
    );
  } catch {
    redirect("/unauthorized");
  }
}
