"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Organization } from "@/types/database";

// Client-side slug generation function
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface OrganizationSettingsProps {
  organization: Organization;
}

export function OrganizationSettings({ organization }: OrganizationSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    slug: organization.slug,
    description: organization.description || "",
    logo_url: organization.logo_url || "",
  });

  const supabase = createClient();

  // Check if slug is available (excluding current organization)
  const checkSlugAvailability = async (slug: string, currentOrgId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .neq("id", currentOrgId)
      .single();

    return !data; // Available if no data found
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check slug availability if changed
      if (formData.slug !== organization.slug) {
        const slugAvail = await checkSlugAvailability(formData.slug, organization.id);
        if (!slugAvail) {
          toast.error("This slug is already taken");
          return;
        }
      }

      const { error } = await supabase
        .from("organizations")
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          logo_url: formData.logo_url || null,
        })
        .eq("id", organization.id);

      if (error) throw error;

      toast.success("Organization updated successfully!");
      
      // If slug changed, redirect to new URL
      if (formData.slug !== organization.slug) {
        router.push(`/organizations/${formData.slug}/manage`);
      }
      
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
        <CardDescription>Update your organization information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
