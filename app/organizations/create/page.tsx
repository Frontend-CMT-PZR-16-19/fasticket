import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";

export const metadata = {
  title: "Create Organization - Fasticket",
  description: "Start organizing events by creating your organization",
};

export default async function CreateOrganizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Create an Organization</h1>
          <p className="text-muted-foreground text-lg">
            Start organizing events by creating your organization. You'll be
            automatically added as an organizer.
          </p>
        </div>
        <CreateOrganizationForm userId={user.id} />
      </div>
    </div>
  );
}
