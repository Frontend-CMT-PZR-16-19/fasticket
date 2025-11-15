"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreVertical, UserPlus, Mail, Trash2, Shield } from "lucide-react";

interface Member {
  id: string;
  role: "organizer" | "member";
  joined_at: string;
  profile: {
    id: string;
    fullname: string;
    avatar_url: string | null;
  };
}

interface MemberManagementProps {
  organizationId: string;
  organizationSlug: string;
  members: Member[];
}

export function MemberManagement({ organizationId, organizationSlug, members }: MemberManagementProps) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const supabase = createClient();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      // In a real app, you'd send an invitation email
      // For now, we'll just show a message
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handlePromoteToOrganizer = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ role: "organizer" })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member promoted to organizer");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to promote member");
    }
  };

  const handleDemoteToMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ role: "member" })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Organizer demoted to member");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to demote organizer");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this organization?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member removed successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members ({members.length})</CardTitle>
        <CardDescription>Manage organization members and their roles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite Member */}
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email to invite..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={isInviting}>
            <UserPlus className="mr-2 h-4 w-4" />
            {isInviting ? "Inviting..." : "Invite"}
          </Button>
        </form>

        {/* Members List */}
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={member.profile.avatar_url || ""} />
                  <AvatarFallback>{getInitials(member.profile.fullname)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.profile.fullname}</p>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={member.role === "organizer" ? "default" : "secondary"}>
                  {member.role === "organizer" ? (
                    <>
                      <Shield className="mr-1 h-3 w-3" />
                      Organizer
                    </>
                  ) : (
                    "Member"
                  )}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role === "member" ? (
                      <DropdownMenuItem onClick={() => handlePromoteToOrganizer(member.id)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Promote to Organizer
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleDemoteToMember(member.id)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Demote to Member
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(member.id, member.profile.fullname)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
