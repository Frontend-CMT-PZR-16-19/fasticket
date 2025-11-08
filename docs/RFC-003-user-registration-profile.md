# RFC-003: User Registration & Profile Management

**Status**: Draft  
**Created**: 8 Kasım 2025  
**Author**: GitHub Copilot  
**Related**: RFC-001, RFC-002

## Abstract

Bu RFC, kullanıcı kayıt akışını, profil yönetimini ve mevcut sign-up sisteminin güncellenmesini detaylandırır. Tüm kullanıcılar tek bir kayıt flow'u kullanır ve sonradan organizasyon oluşturabilirler.

## Current State

Mevcut kayıt sistemi:
- ✅ Email + Password + Fullname ile kayıt
- ✅ Supabase trigger ile profile oluşturma
- ✅ Email confirmation
- ❌ Avatar upload yok
- ❌ Bio/description yok
- ❌ Profile edit sayfası eksik

## Goals

1. Mevcut kayıt akışını korumak (breaking change yok)
2. Profile tablosuna yeni alanlar eklemek
3. Profile edit sayfası oluşturmak
4. Avatar upload işlevi eklemek
5. User dashboard oluşturmak

## Design

### Updated Registration Flow

```
User Input:
  - Email (required)
  - Full Name (required)  
  - Password (required)
  - Confirm Password (required)
    |
    v
Supabase Auth Sign Up
    |
    v
Trigger: handle_new_user()
    |
    v
Create Profile in public.profiles
    |
    v
Email Confirmation Sent
    |
    v
User Redirected to Success Page
```

### Profile Schema (Updated)

RFC-001'de tanımlandı, tekrar:

```sql
-- Profiles table (updated)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  fullname TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Trigger Update

Mevcut trigger'ı güncellemeye gerek yok, çünkü sadece `fullname` alıyor. Yeni alanlar (avatar, bio) sonradan profil edit ile eklenecek.

```sql
-- Mevcut trigger (değişiklik yok)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, fullname)
  VALUES (new.id, new.raw_user_meta_data ->> 'fullname');
  RETURN new;
END;
$$;
```

### RLS Policies for Profiles

```sql
-- RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view public profile info
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Profiles are created via trigger only
-- No INSERT policy needed for users
```

## Component Updates

### 1. Sign Up Form (Minimal Changes)

Mevcut form'u koruyoruz, sadece küçük iyileştirmeler:

```typescript
// components/sign-up-form.tsx (güncellenmiş)

"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== repeatPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            fullname,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created! Please check your email to confirm.");
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Join Fasticket to discover and book amazing events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  minLength={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeatPassword">Confirm Password</Label>
                <Input
                  id="repeatPassword"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Profile Edit Page (New)

```typescript
// app/profile/edit/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/");
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      <ProfileEditForm profile={profile} />
    </div>
  );
}
```

### 3. Profile Edit Form Component (New)

```typescript
// components/profile/profile-edit-form.tsx

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";

interface ProfileEditFormProps {
  profile: Profile;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [fullname, setFullname] = useState(profile.fullname);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profiles").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          fullname,
          bio,
          avatar_url: avatarUrl || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    return fullname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} alt={fullname} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? "Uploading..." : "Change Avatar"}
                    </span>
                  </Button>
                </div>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullname">Full Name</Label>
            <Input
              id="fullname"
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
              minLength={2}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 4. Profile View Page (New)

```typescript
// app/profile/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { getUserOrganizations } from "@/lib/auth/permissions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/");
  }

  const organizations = await getUserOrganizations(user.id);

  const getInitials = () => {
    return profile.fullname
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button asChild>
          <Link href="/profile/edit">Edit Profile</Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || ""} alt={profile.fullname} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{profile.fullname}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                {profile.bio && (
                  <p className="mt-4 text-sm">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizations Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Organizations</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/organizations/create">Create Organization</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {organizations.length === 0 ? (
              <p className="text-muted-foreground">
                You haven't joined any organizations yet.
              </p>
            ) : (
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">
                        {org.organization.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Role: {org.role}
                      </p>
                    </div>
                    {org.role === "organizer" && (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/organizations/${org.organization.slug}/manage`}
                        >
                          Manage
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/my-tickets">View All Tickets</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings">Manage Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

## Supabase Storage Setup

Avatar'lar için storage bucket gerekli:

```sql
-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');
```

## TypeScript Types

```typescript
// types/database.ts (addition)

export interface Profile {
  id: string;
  fullname: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithStats extends Profile {
  booking_count: number;
  organization_count: number;
}
```

## Missing UI Components

Eğer yoksa oluşturulacak:

```bash
# Textarea component
npx shadcn-ui@latest add textarea
```

## Navigation Update

Profile sayfalarını navigation'a ekle:

```typescript
// components/navigation.tsx içine

{user && (
  <>
    <Link href="/profile">
      <Avatar className="h-8 w-8">
        <AvatarImage src={profile?.avatar_url || ""} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>
    </Link>
  </>
)}
```

## API Endpoints (Optional)

```typescript
// app/api/profile/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fullname, bio, avatar_url } = body;

  const { data, error } = await supabase
    .from("profiles")
    .update({ fullname, bio, avatar_url })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Yeni kullanıcı kaydı yapılabiliyor
- [ ] Email confirmation alınıyor
- [ ] Profile otomatik oluşturuluyor
- [ ] Avatar upload çalışıyor
- [ ] Profile edit kaydediliyor
- [ ] Profile view sayfası görüntüleniyor
- [ ] Organizations listeleniyor

### Unit Tests

```typescript
// __tests__/components/profile-edit-form.test.tsx

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

describe("ProfileEditForm", () => {
  const mockProfile = {
    id: "123",
    fullname: "John Doe",
    bio: "Test bio",
    avatar_url: null,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  };

  test("renders profile information", () => {
    render(<ProfileEditForm profile={mockProfile} />);
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test bio")).toBeInTheDocument();
  });

  test("updates fullname", async () => {
    render(<ProfileEditForm profile={mockProfile} />);
    const input = screen.getByLabelText(/full name/i);
    fireEvent.change(input, { target: { value: "Jane Doe" } });
    expect(input).toHaveValue("Jane Doe");
  });
});
```

## Migration Steps

1. ✅ Mevcut profiles table'ını güncelle (ALTER TABLE)
2. ✅ Storage bucket oluştur
3. ✅ Storage policies ekle
4. ✅ Component'leri oluştur
5. ✅ Routes ekle
6. ✅ Navigation güncelle
7. ✅ Test et

## Security Notes

1. Avatar upload size limit: 2MB
2. Avatar validation: sadece image types
3. Bio character limit: 500
4. RLS policies ile profile sadece owner tarafından edit edilebilir
5. Storage policies ile avatar sadece owner tarafından upload edilebilir

## Open Questions

- [ ] Avatar crop/resize tool gerekli mi?
- [ ] Social media links eklensin mi?
- [ ] Profile privacy settings (public/private)?
- [ ] Delete account functionality?

## References

- Supabase Storage Documentation
- Next.js File Upload Best Practices
- shadcn/ui Components

## Approval

- [ ] Reviewed by: _________________
- [ ] Approved by: _________________
- [ ] Implementation Date: _________________
