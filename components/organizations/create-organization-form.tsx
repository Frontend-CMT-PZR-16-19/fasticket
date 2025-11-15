"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Client-side slug generation function
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface CreateOrganizationFormProps {
  userId: string;
}

export function CreateOrganizationForm({ userId }: CreateOrganizationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
  });

  const supabase = createClient();

  // Check if slug is available
  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    return !data && error?.code === "PGRST116"; // PGRST116 = no rows returned
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate slug
      if (!formData.slug || formData.slug.length < 3) {
        toast.error("Organization name must be at least 3 characters");
        return;
      }

      // Check slug availability
      const slugAvailable = await checkSlugAvailability(formData.slug);
      if (!slugAvailable) {
        toast.error("This organization name is already taken. Please choose another.");
        return;
      }

      // Create organization
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          logo_url: formData.logo_url || null,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Organization created successfully!");
      router.push(`/organizations/${data.slug}`);
      router.refresh();
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast.error(error.message || "Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Create your organization to start hosting events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="My Amazing Organization"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          {/* Slug (auto-generated, editable) */}
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              type="text"
              placeholder="my-amazing-organization"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: generateSlug(e.target.value) })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Your organization will be accessible at: /organizations/{formData.slug || "your-slug"}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell people about your organization..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              type="url"
              placeholder="https://example.com/logo.png"
              value={formData.logo_url}
              onChange={(e) =>
                setFormData({ ...formData, logo_url: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to your organization's logo image
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
