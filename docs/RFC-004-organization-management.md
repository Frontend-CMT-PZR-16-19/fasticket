# RFC-004: Organization Management System

**Status**: Draft  
**Created**: 8 Kasım 2025  
**Author**: GitHub Copilot  
**Related**: RFC-001, RFC-002, RFC-005

## Abstract

Bu RFC, organizasyon yönetim sistemini detaylandırır: organizasyon oluşturma, üye davet etme, organizer rolü atama, ve organizasyon yönetim panelini içerir.

## Goals

1. Her kullanıcı bir veya daha fazla organizasyon oluşturabilmeli
2. Organizasyon oluşturan kişi otomatik olarak organizer olmalı
3. Organizer'lar başka kullanıcıları member veya organizer olarak ekleyebilmeli
4. Organizasyonlar public olarak görüntülenebilmeli
5. Organization management dashboard oluşturulmalı

## Design

### Organization Lifecycle

```
User Creates Organization
  ↓
User becomes Organizer (automatic via trigger)
  ↓
Organizer invites members
  ↓
Members can be promoted to Organizer
  ↓
Organization can create Events (RFC-005)
```

### Database Schema

RFC-001'de tanımlanan tables:
- `organizations`: Organization details
- `organization_members`: Members and their roles
- Triggers: Auto-add creator as organizer

### User Flows

#### 1. Create Organization Flow

```
User clicks "Create Organization"
  ↓
Fill form:
  - Name (required)
  - Description (optional)
  - Logo (optional)
  ↓
System generates slug from name
  ↓
Insert into organizations table
  ↓
Trigger adds user as organizer
  ↓
Redirect to organization page
```

#### 2. Invite Member Flow

```
Organizer opens "Manage Members"
  ↓
Enter email of user to invite
  ↓
Select role (member/organizer)
  ↓
System checks if user exists
  ↓
Add to organization_members
  ↓
(Optional) Send email notification
```

#### 3. Promote Member Flow

```
Organizer views members list
  ↓
Click "Promote to Organizer" on member
  ↓
Confirmation dialog
  ↓
Update role in organization_members
  ↓
Member now has organizer permissions
```

## Components & Pages

### 1. Create Organization Page

```typescript
// app/organizations/create/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";

export default async function CreateOrganizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-2">Create an Organization</h1>
      <p className="text-muted-foreground mb-6">
        Start organizing events by creating your organization
      </p>
      <CreateOrganizationForm userId={user.id} />
    </div>
  );
}
```

### 2. Create Organization Form

```typescript
// components/organizations/create-organization-form.tsx

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateOrganizationFormProps {
  userId: string;
}

export function CreateOrganizationForm({ userId }: CreateOrganizationFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const slug = generateSlug(name);

    if (!slug) {
      toast.error("Please enter a valid organization name");
      setIsLoading(false);
      return;
    }

    try {
      // Check if slug already exists
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        toast.error("An organization with this name already exists");
        setIsLoading(false);
        return;
      }

      // Create organization
      const { data: organization, error } = await supabase
        .from("organizations")
        .insert({
          name,
          slug,
          description: description || null,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Organization created successfully!");
      router.push(`/organizations/${organization.slug}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="My Awesome Events"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              maxLength={100}
            />
            {name && (
              <p className="text-xs text-muted-foreground">
                URL: /organizations/{generateSlug(name)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell people what your organization is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? "Creating..." : "Create Organization"}
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

### 3. Organization Public Page

```typescript
// app/organizations/[slug]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { isOrganizer } from "@/lib/auth/permissions";

interface PageProps {
  params: { slug: string };
}

export default async function OrganizationPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get organization
  const { data: organization, error } = await supabase
    .from("organizations")
    .select(`
      *,
      creator:profiles!created_by(fullname, avatar_url)
    `)
    .eq("slug", params.slug)
    .single();

  if (error || !organization) {
    notFound();
  }

  // Get upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(6);

  // Get member count
  const { count: memberCount } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  // Check if user is organizer
  const userIsOrganizer = user
    ? await isOrganizer(user.id, organization.id)
    : false;

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{organization.name}</h1>
          {organization.description && (
            <p className="text-lg text-muted-foreground">
              {organization.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="secondary">
              {memberCount} {memberCount === 1 ? "Member" : "Members"}
            </Badge>
            <Badge variant="secondary">
              {upcomingEvents?.length || 0} Upcoming Events
            </Badge>
          </div>
        </div>
        {userIsOrganizer && (
          <Button asChild>
            <Link href={`/organizations/${params.slug}/manage`}>
              Manage Organization
            </Link>
          </Button>
        )}
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Events</CardTitle>
          {userIsOrganizer && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/organizations/${params.slug}/events/create`}>
                Create Event
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!upcomingEvents || upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground">No upcoming events</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.start_date).toLocaleDateString()}
                      </p>
                      <Badge className="mt-2">
                        {event.is_free ? "Free" : `$${event.ticket_price}`}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4. Organization Management Page

```typescript
// app/organizations/[slug]/manage/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth/server-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettingsTab } from "@/components/organizations/organization-settings-tab";
import { OrganizationMembersTab } from "@/components/organizations/organization-members-tab";
import { OrganizationEventsTab } from "@/components/organizations/organization-events-tab";

interface PageProps {
  params: { slug: string };
}

export default async function OrganizationManagePage({ params }: PageProps) {
  const supabase = await createClient();

  // Get organization
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!organization) {
    notFound();
  }

  // Verify user is organizer
  try {
    await requireOrganizer(organization.id);
  } catch {
    redirect("/unauthorized");
  }

  // Get members
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      *,
      profile:profiles(id, fullname, avatar_url, email:auth.users(email))
    `)
    .eq("organization_id", organization.id)
    .order("joined_at", { ascending: false });

  // Get events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("organization_id", organization.id)
    .order("start_date", { ascending: false });

  return (
    <div className="container max-w-6xl py-10">
      <h1 className="text-3xl font-bold mb-6">Manage {organization.name}</h1>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <OrganizationMembersTab
            organization={organization}
            members={members || []}
          />
        </TabsContent>

        <TabsContent value="events">
          <OrganizationEventsTab
            organization={organization}
            events={events || []}
          />
        </TabsContent>

        <TabsContent value="settings">
          <OrganizationSettingsTab organization={organization} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 5. Organization Members Tab

```typescript
// components/organizations/organization-members-tab.tsx

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Organization, OrganizationMember } from "@/types/database";

interface OrganizationMembersTabProps {
  organization: Organization;
  members: any[];
}

export function OrganizationMembersTab({
  organization,
  members: initialMembers,
}: OrganizationMembersTabProps) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "organizer">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (userError || !userData) {
        toast.error("User not found. They need to sign up first.");
        setIsInviting(false);
        return;
      }

      // Check if already a member
      const existing = members.find((m) => m.user_id === userData.id);
      if (existing) {
        toast.error("User is already a member of this organization");
        setIsInviting(false);
        return;
      }

      // Add member
      const { data: newMember, error } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organization.id,
          user_id: userData.id,
          role,
        })
        .select(`
          *,
          profile:profiles(id, fullname, avatar_url)
        `)
        .single();

      if (error) throw error;

      setMembers([...members, newMember]);
      setEmail("");
      setRole("member");
      toast.success("Member invited successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: "member" | "organizer") => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toast.success("Member role updated!");
      router.refresh();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update member role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      setMembers(members.filter((m) => m.id !== memberId));
      setMemberToRemove(null);
      toast.success("Member removed!");
      router.refresh();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
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
    <div className="space-y-6">
      {/* Invite Member Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? "Inviting..." : "Invite Member"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.profile.avatar_url || ""} />
                    <AvatarFallback>
                      {getInitials(member.profile.fullname)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.profile.fullname}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={member.role === "organizer" ? "default" : "secondary"}>
                    {member.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "member" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateRole(member.id, "organizer")}
                    >
                      Promote to Organizer
                    </Button>
                  )}
                  {member.role === "organizer" && members.filter(m => m.role === "organizer").length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateRole(member.id, "member")}
                    >
                      Demote to Member
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setMemberToRemove(member.id)}
                    disabled={member.role === "organizer" && members.filter(m => m.role === "organizer").length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member? They will lose access
              to this organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

## Helper Functions

```typescript
// lib/organizations/queries.ts

import { createClient } from "@/lib/supabase/client";

export async function getUserOrganizations(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      role,
      joined_at,
      organization:organizations(*)
    `)
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrganizationBySlug(slug: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrganizationMembers(organizationId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("organization_id", organizationId)
    .order("joined_at", { ascending: false });

  if (error) throw error;
  return data;
}
```

## API Routes

```typescript
// app/api/organizations/[id]/members/route.ts

import { createClient } from "@/lib/supabase/server";
import { requireOrganizer } from "@/lib/auth/server-permissions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireOrganizer(params.id);
    const body = await request.json();
    const { user_id, role } = body;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organization_members")
      .insert({
        organization_id: params.id,
        user_id,
        role,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
```

## Testing Strategy

### Manual Testing

- [ ] Create organization
- [ ] Verify creator is auto-added as organizer
- [ ] Invite member by email
- [ ] Promote member to organizer
- [ ] Demote organizer to member
- [ ] Remove member
- [ ] Verify permissions (non-organizers can't manage)

### Unit Tests

```typescript
describe("Organization Management", () => {
  test("generates valid slug from name", () => {
    expect(generateSlug("My Awesome Events")).toBe("my-awesome-events");
    expect(generateSlug("Test@#$Organization!")).toBe("test-organization");
  });

  test("creator is added as organizer", async () => {
    // Create organization
    // Verify membership with organizer role exists
  });
});
```

## Open Questions

- [ ] Organization logo upload?
- [ ] Email notifications for invitations?
- [ ] Member approval workflow (request to join)?
- [ ] Organization verification badge?
- [ ] Transfer ownership functionality?

## Approval

- [ ] Reviewed by: _________________
- [ ] Approved by: _________________
- [ ] Implementation Date: _________________
