import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EditProfileForm from "@/components/profile/edit-profile-form";

export default async function EditProfilePage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground text-lg">
            Update your profile information
          </p>
        </div>
        <EditProfileForm
          initialData={{
            fullname: profile?.fullname || "",
            avatar_url: profile?.avatar_url || "",
          }}
          userId={user.id}
        />
      </div>
    </div>
  );
}
