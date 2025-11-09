import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";

export default async function CreateOrganizationPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Organization</h1>
          <p className="text-muted-foreground">
            Start organizing events by creating your organization
          </p>
        </div>
        
        <CreateOrganizationForm userId={user.id} />
      </div>
    </div>
  );
}
