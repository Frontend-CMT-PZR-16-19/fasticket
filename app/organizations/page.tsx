import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Users } from "lucide-react";

export default async function OrganizationsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's organizations with role
  const { data: memberships } = await supabase
    .from("organization_members")
    .select(`
      role,
      organization:organizations (
        id,
        name,
        slug,
        description,
        logo_url,
        created_at
      )
    `)
    .eq("user_id", user.id);

  const organizations = memberships?.map((m: any) => ({
    ...m.organization,
    role: m.role,
  })) || [];

  const organizerOrgs = organizations.filter((o: any) => o.role === "organizer");
  const memberOrgs = organizations.filter((o: any) => o.role === "member");

  return (
    <div className="container py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Organizations</h1>
            <p className="text-muted-foreground">
              Manage your organizations and memberships
            </p>
          </div>
          <Button asChild>
            <Link href="/organizations/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Link>
          </Button>
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No organizations yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first organization to start hosting events
              </p>
              <Button asChild>
                <Link href="/organizations/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Organizations where user is organizer */}
            {organizerOrgs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  Organizations I Manage ({organizerOrgs.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {organizerOrgs.map((org: any) => (
                    <OrganizationCard key={org.id} organization={org} />
                  ))}
                </div>
              </div>
            )}

            {/* Organizations where user is member */}
            {memberOrgs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  Organizations I'm Part Of ({memberOrgs.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {memberOrgs.map((org: any) => (
                    <OrganizationCard key={org.id} organization={org} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrganizationCard({ organization }: { organization: any }) {
  return (
    <Link href={`/organizations/${organization.slug}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {organization.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="truncate">{organization.name}</span>
              </CardTitle>
              <CardDescription className="mt-2 line-clamp-2">
                {organization.description || "No description"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant={organization.role === "organizer" ? "default" : "secondary"}>
              {organization.role === "organizer" ? "Organizer" : "Member"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(organization.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
