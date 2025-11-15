import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Mail, Calendar, Edit2 } from "lucide-react";

export default async function ProfilePage() {
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

  const getInitials = () => {
    if (!profile?.fullname) return "U";
    return profile.fullname
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">
              View and manage your profile information
            </p>
          </div>
          <Button asChild>
            <Link href="/profile/edit">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {profile?.fullname || "User"}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />

            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Edit2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {profile?.fullname || "Not set"}
                </p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(profile?.created_at || "").toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>

            <Separator />

            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="font-semibold">Quick Links</h3>
              <div className="grid gap-2">
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/my-tickets">My Tickets</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/organizations/create">
                    Create Organization
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
