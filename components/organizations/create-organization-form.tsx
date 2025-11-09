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
import { Loader2 } from "lucide-react";

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
        .maybeSingle();

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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating..." : "Create Organization"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
