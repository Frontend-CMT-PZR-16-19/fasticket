import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Shield, Users } from "lucide-react";
import { InviteMemberForm } from "@/components/invite-member-form";
import { MemberRoleActions } from "@/components/member-role-actions";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganizationManagePage({ params }: PageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch organization with members
  const { data: organization, error } = await supabase
    .from("organizations")
    .select(
      `
      *,
      creator:profiles!organizations_created_by_fkey(id, fullname, avatar_url),
      organization_members(
        id,
        role,
        joined_at,
        user_id,
        profiles!organization_members_user_id_fkey(id, fullname, avatar_url, email)
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !organization) {
    notFound();
  }

  // Check if current user is an organizer
  const currentMember = organization.organization_members.find(
    (m: any) => m.user_id === user.id
  );

  if (!currentMember || currentMember.role !== "organizer") {
    redirect(`/organizations/${slug}`);
  }

  const organizers = organization.organization_members.filter(
    (m: any) => m.role === "organizer"
  );
  const members = organization.organization_members.filter(
    (m: any) => m.role === "member"
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <Link
        href={`/organizations/${slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {organization.name}
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Manage Organization</h1>
        <p className="text-lg text-muted-foreground">{organization.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organizers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Organizers ({organizers.length})
              </CardTitle>
              <CardDescription>
                Organizers can manage events, members, and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {organizers.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.profiles.fullname
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {member.profiles.fullname || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profiles.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Organizer</Badge>
                      {member.user_id !== organization.created_by && (
                        <MemberRoleActions
                          memberId={member.id}
                          currentRole="organizer"
                          organizationSlug={slug}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </CardTitle>
              <CardDescription>
                Members can view events and organization details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No members yet. Invite someone to join!
                </p>
              ) : (
                <div className="space-y-3">
                  {members.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.profiles.fullname
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">
                            {member.profiles.fullname || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles.email}
                          </p>
                        </div>
                      </div>
                      <MemberRoleActions
                        memberId={member.id}
                        currentRole="member"
                        organizationSlug={slug}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Member
              </CardTitle>
              <CardDescription>
                Add new members to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteMemberForm
                organizationId={organization.id}
                organizationSlug={slug}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Members</span>
                <span className="font-semibold">
                  {organization.organization_members.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organizers</span>
                <span className="font-semibold">{organizers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-semibold">{members.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
