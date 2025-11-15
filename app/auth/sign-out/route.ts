import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Sign out
  const { error } = await supabase.auth.signOut();

  if (error) {
    return redirect("/auth/error");
  }

  return redirect("/auth/login");
}
