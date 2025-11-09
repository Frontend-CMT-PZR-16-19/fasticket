"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Organization, OrganizationMember, Profile } from "@/types/database";
import { Crown, User } from "lucide-react";

interface OrganizationMembersTabProps {
  organization: Organization;
  members: (OrganizationMember & { profile: Profile })[];
}

export function OrganizationMembersTab({
  organization,
  members,
}: OrganizationMembersTabProps) {
  const organizers = members.filter((m) => m.role === "organizer");
  const regularMembers = members.filter((m) => m.role === "member");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Organizers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Organizers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Organizers
          </CardTitle>
          <CardDescription>
            Users who can manage the organization and create events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.profile.avatar_url || ""} />
                    <AvatarFallback>
                      {getInitials(member.profile.fullname)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.profile.fullname}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined{" "}
                      {new Date(member.joined_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  <Crown className="h-3 w-3 mr-1" />
                  Organizer
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regular Members List */}
      {regularMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Members
            </CardTitle>
            <CardDescription>Regular members of the organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regularMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.profile.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(member.profile.fullname)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.profile.fullname}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined{" "}
                        {new Date(member.joined_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Promote to Organizer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Members (Coming Soon) */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Members</CardTitle>
          <CardDescription>
            Add new members to your organization (Coming Soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Invite Members</Button>
        </CardContent>
      </Card>
    </div>
  );
}
