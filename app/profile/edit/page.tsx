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
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
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
