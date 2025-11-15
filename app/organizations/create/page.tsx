"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateOrganizationPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("You must be logged in to create an organization");
        router.push("/auth/login");
        return;
      }

      const slug = generateSlug(name);

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
      const { data: organization, error: createError } = await supabase
        .from("organizations")
        .insert({
          name: name.trim(),
          slug,
          description: description.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating organization:", createError);
        toast.error("Failed to create organization");
        setIsLoading(false);
        return;
      }

      toast.success("Organization created successfully!");
      router.push(`/organizations/${slug}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Link
        href="/organizations"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Organizations
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>
            Create a new organization to start hosting events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Tech Community Istanbul"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
              {name && (
                <p className="text-xs text-muted-foreground">
                  Slug: {generateSlug(name)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Tell us about your organization..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Organization"}
              </Button>
              <Link href="/organizations" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
