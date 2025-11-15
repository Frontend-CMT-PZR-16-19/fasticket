import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Get the member to remove
    const { data: targetMember, error: memberError } = await supabase
      .from("organization_members")
      .select("*, organization:organizations(id, created_by)")
      .eq("id", memberId)
      .single();

    if (memberError || !targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if current user is an organizer
    const { data: currentMembership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", targetMember.organization.id)
      .eq("user_id", user.id)
      .single();

    if (!currentMembership || currentMembership.role !== "organizer") {
      return NextResponse.json(
        { error: "Only organizers can remove members" },
        { status: 403 }
      );
    }

    // Don't allow removing the creator
    if (targetMember.user_id === targetMember.organization.created_by) {
      return NextResponse.json(
        { error: "Cannot remove the organization creator" },
        { status: 400 }
      );
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
