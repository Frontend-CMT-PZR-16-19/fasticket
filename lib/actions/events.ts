'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CreateEventInput, UpdateEventInput } from '@/types/database';

/**
 * Create a new event
 * Only organizers can create events
 */
export async function createEvent(input: CreateEventInput) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Generate slug from title
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...input,
      slug,
      created_by: user.id,
      available_capacity: input.total_capacity,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations`);
  return { data };
}

/**
 * Update an event
 * Only organizers can update
 */
export async function updateEvent(eventId: string, input: UpdateEventInput) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${data.slug}`);
  revalidatePath(`/organizations`);
  return { data };
}

/**
 * Delete an event
 * Only organizers can delete
 */
export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations`);
  return { success: true };
}

/**
 * Get events by organization
 */
export async function getOrganizationEvents(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug
      )
    `)
    .eq('organization_id', organizationId)
    .order('start_date', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * Get event by slug and organization
 */
export async function getEventBySlug(organizationSlug: string, eventSlug: string) {
  const supabase = await createClient();

  // First get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', organizationSlug)
    .single();

  if (!org) {
    return { error: 'Organization not found' };
  }

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug,
        description,
        logo_url
      )
    `)
    .eq('organization_id', org.id)
    .eq('slug', eventSlug)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * Get all published events
 */
export async function getPublishedEvents() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug
      )
    `)
    .eq('status', 'published')
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug,
        description,
        logo_url
      )
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * Get event by slug only (direct)
 */
export async function getEventBySlugDirect(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug,
        description,
        logo_url
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Update event status
 */
export async function updateEventStatus(
  eventId: string,
  status: 'draft' | 'published' | 'cancelled'
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations`);
  revalidatePath(`/events/${data.slug}`);
  return { data };
}
