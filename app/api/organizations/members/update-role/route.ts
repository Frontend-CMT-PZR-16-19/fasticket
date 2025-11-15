import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
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

    const { memberId, role } = await request.json();

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the member to update
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
        { error: "Only organizers can update roles" },
        { status: 403 }
      );
    }

    // Don't allow changing the creator's role
    if (targetMember.user_id === targetMember.organization.created_by) {
      return NextResponse.json(
        { error: "Cannot change the creator's role" },
        { status: 400 }
      );
    }

    // Update role
    const { data: updatedMember, error: updateError } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("id", memberId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: updatedMember,
    });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
