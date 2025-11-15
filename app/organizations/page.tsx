import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function OrganizationsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all organizations with creator info and member count
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select(
      `
      *,
      creator:profiles!organizations_created_by_fkey(id, fullname, avatar_url),
      organization_members(count)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching organizations:", error);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Organizations</h1>
          <p className="text-muted-foreground">
            Browse all organizations and their events
          </p>
        </div>
        {user && (
          <Link href="/organizations/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </Link>
        )}
      </div>

      {!organizations || organizations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No organizations yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create an organization and start hosting events!
            </p>
            {user && (
              <Link href="/organizations/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Organization
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org: any) => {
            const memberCount = org.organization_members?.[0]?.count || 0;
            const creator = org.creator;

            return (
              <Link key={org.id} href={`/organizations/${org.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={org.logo_url || undefined} />
                        <AvatarFallback>
                          {org.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="line-clamp-1">{org.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {org.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{memberCount} members</span>
                      </div>
                      {creator && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">by</span>
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={creator.avatar_url || undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {creator.fullname
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate max-w-[100px]">
                            {creator.fullname}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
