import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationSettings } from "@/components/organizations/organization-settings";
import { MemberManagement } from "@/components/organizations/member-management";

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function OrganizationManagePage({ params }: PageProps) {
  const supabase = await createClient();
  
  // Require authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get organization
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!organization) {
    notFound();
  }

  // Require organizer role
  try {
    await requireOrganizer(organization.id);
  } catch {
    redirect(`/organizations/${params.slug}`);
  }

  // Get members
  const { data: membersData } = await supabase
    .from("organization_members")
    .select(`
      id,
      role,
      joined_at,
      profile:profiles!organization_members_user_id_fkey (
        id,
        fullname,
        avatar_url
      )
    `)
    .eq("organization_id", organization.id)
    .order("joined_at", { ascending: false });

  // Transform the data to match the expected type
  const members = membersData?.map((member: any) => ({
    ...member,
    profile: Array.isArray(member.profile) ? member.profile[0] : member.profile
  })) || [];

  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Organization</h1>
          <p className="text-muted-foreground">
            Update settings and manage members for {organization.name}
          </p>
        </div>

        {/* Organization Settings */}
        <OrganizationSettings organization={organization} />

        {/* Member Management */}
        <MemberManagement
          organizationId={organization.id}
          organizationSlug={organization.slug}
          members={members}
        />
      </div>
    </div>
  );
}
