"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProfileFormData {
  fullname: string;
  avatar_url: string;
}

export default function EditProfileForm({
  initialData,
  userId,
}: {
  initialData: ProfileFormData;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(initialData);

  const getInitials = () => {
    if (!formData.fullname) return "U";
    return formData.fullname
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          fullname: formData.fullname,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          fullname: formData.fullname,
          avatar_url: formData.avatar_url,
        },
      });

      if (authError) throw authError;

      toast.success("Profile updated successfully!");
      router.push("/profile");
      router.refresh();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback className="text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>Edit Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullname">Full Name</Label>
            <Input
              id="fullname"
              type="text"
              value={formData.fullname}
              onChange={(e) =>
                setFormData({ ...formData, fullname: e.target.value })
              }
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) =>
                setFormData({ ...formData, avatar_url: e.target.value })
              }
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to your profile picture
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              asChild
              disabled={loading}
            >
              <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
