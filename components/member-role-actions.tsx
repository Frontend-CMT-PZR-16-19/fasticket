"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MemberRoleActionsProps {
  memberId: string;
  currentRole: "organizer" | "member";
  organizationSlug: string;
}

export function MemberRoleActions({
  memberId,
  currentRole,
  organizationSlug,
}: MemberRoleActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChangeRole = async (newRole: "organizer" | "member") => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/organizations/members/update-role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
          role: newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      toast.success("Role updated", {
        description: `Member is now ${newRole === "organizer" ? "an organizer" : "a member"}`,
      });

      router.refresh();
    } catch (error) {
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/organizations/members/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member");
      }

      toast.success("Member removed", {
        description: "Member has been removed from the organization",
      });

      router.refresh();
    } catch (error) {
      toast.error("Removal failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentRole === "member" ? (
          <DropdownMenuItem onClick={() => handleChangeRole("organizer")}>
            <ArrowUp className="mr-2 h-4 w-4" />
            Promote to Organizer
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleChangeRole("member")}>
            <ArrowDown className="mr-2 h-4 w-4" />
            Demote to Member
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleRemoveMember}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
