"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CreateEventFormProps {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  userId: string;
}

export function CreateEventForm({ organization, userId }: CreateEventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    venue_name: "",
    venue_address: "",
    venue_city: "",
    venue_country: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    total_capacity: "",
    price: "",
    isFree: true,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = generateSlug(e.target.value);
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Validate dates
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      
      if (endDateTime <= startDateTime) {
        toast.error("End date must be after start date");
        setIsSubmitting(false);
        return;
      }

      if (startDateTime <= new Date()) {
        toast.error("Start date must be in the future");
        setIsSubmitting(false);
        return;
      }

      // Check if slug already exists for this organization
      const { data: existingEvent } = await supabase
        .from("events")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("slug", formData.slug)
        .maybeSingle();

      if (existingEvent) {
        toast.error("An event with this slug already exists for this organization");
        setIsSubmitting(false);
        return;
      }

      // Create event
      const { data: event, error } = await supabase
        .from("events")
        .insert({
          organization_id: organization.id,
          title: formData.title,
          slug: formData.slug,
          description: formData.description || null,
          venue_name: formData.venue_name,
          venue_address: formData.venue_address || null,
          venue_city: formData.venue_city,
          venue_country: formData.venue_country,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          total_capacity: parseInt(formData.total_capacity),
          price: formData.isFree ? 0 : parseFloat(formData.price),
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Event created successfully!");
      router.push(`/organizations/${organization.slug}/manage?tab=events`);
      router.refresh();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Basic information about your event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g., Summer Music Festival 2024"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="summer-music-festival-2024"
              required
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Event URL: /events/{formData.slug || "your-event-slug"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>
            Where will your event take place?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue_name">Venue Name *</Label>
            <Input
              id="venue_name"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              placeholder="e.g., Madison Square Garden"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_address">Street Address</Label>
            <Input
              id="venue_address"
              value={formData.venue_address}
              onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
              placeholder="e.g., 4 Pennsylvania Plaza"
              maxLength={300}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue_city">City *</Label>
              <Input
                id="venue_city"
                value={formData.venue_city}
                onChange={(e) => setFormData({ ...formData, venue_city: e.target.value })}
                placeholder="e.g., New York"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_country">Country *</Label>
              <Input
                id="venue_country"
                value={formData.venue_country}
                onChange={(e) => setFormData({ ...formData, venue_country: e.target.value })}
                placeholder="e.g., United States"
                required
                maxLength={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date & Time</CardTitle>
          <CardDescription>
            When will your event start and end?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capacity & Pricing</CardTitle>
          <CardDescription>
            How many people can attend and what's the ticket price?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total_capacity">Total Capacity *</Label>
            <Input
              id="total_capacity"
              type="number"
              min="1"
              value={formData.total_capacity}
              onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value })}
              placeholder="e.g., 500"
              required
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of attendees for this event
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFree"
              checked={formData.isFree}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, isFree: checked as boolean, price: "" })
              }
            />
            <Label htmlFor="isFree" className="cursor-pointer">
              This is a free event
            </Label>
          </div>

          {!formData.isFree && (
            <div className="space-y-2">
              <Label htmlFor="price">Ticket Price *</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., 29.99"
                required={!formData.isFree}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
