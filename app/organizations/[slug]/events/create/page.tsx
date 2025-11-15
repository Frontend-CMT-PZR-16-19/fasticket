"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

interface CreateEventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function CreateEventPage({ params }: CreateEventPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [venueName, setVenueName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [ticketPrice, setTicketPrice] = useState("0");
  const [totalCapacity, setTotalCapacity] = useState("100");
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (data) {
      setOrganization(data);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    if (!organization) {
      toast.error("Organization not found");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("You must be logged in");
        router.push("/auth/login");
        return;
      }

      const slug = generateSlug(title);

      // Check if slug already exists
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        toast.error("An event with this title already exists");
        setIsLoading(false);
        return;
      }

      const capacity = parseInt(totalCapacity) || 0;

      // Create event
      const { data: event, error: createError } = await supabase
        .from("events")
        .insert({
          organization_id: organization.id,
          title: title.trim(),
          slug,
          description: description.trim() || null,
          location: location.trim() || null,
          venue_name: venueName.trim() || null,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          is_free: isFree,
          ticket_price: isFree ? 0 : parseFloat(ticketPrice) || 0,
          total_capacity: capacity,
          available_capacity: capacity,
          status: "published",
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating event:", createError);
        toast.error("Failed to create event");
        setIsLoading(false);
        return;
      }

      toast.success("Event created successfully!");
      router.push(`/organizations/${slug}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  if (!organization) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Link
        href={`/organizations/${slug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {organization.name}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
          <CardDescription>
            Create a new event for {organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g. Summer Music Festival 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Tell attendees about your event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g. Istanbul, Turkey"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name</Label>
              <Input
                id="venueName"
                type="text"
                placeholder="e.g. Madison Square Garden"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFree"
                  checked={isFree}
                  onCheckedChange={(checked) => setIsFree(checked as boolean)}
                />
                <Label htmlFor="isFree" className="cursor-pointer">
                  This is a free event
                </Label>
              </div>

              {!isFree && (
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Ticket Price ($)</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCapacity">Total Capacity</Label>
              <Input
                id="totalCapacity"
                type="number"
                min="1"
                placeholder="100"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of attendees for this event
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Event"}
              </Button>
              <Link href={`/organizations/${slug}`} className="flex-1">
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
