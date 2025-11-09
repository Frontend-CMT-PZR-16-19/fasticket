import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

/**
 * Get current user's profile
 * Cached for performance
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return profile;
});

/**
 * Check if user is a member of an organization
 */
export async function isMember(organizationId: string, userId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();
  
  return !error && !!data;
}

/**
 * Check if user is an organizer of an organization
 */
export async function isOrganizer(organizationId: string, userId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('role', 'organizer')
    .single();
  
  return !error && !!data;
}

/**
 * Get user's role in an organization
 */
export async function getUserRole(
  organizationId: string, 
  userId?: string
): Promise<'organizer' | 'member' | null> {
  const supabase = await createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    userId = user.id;
  }
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return data.role;
}

/**
 * Get all organizations where user is a member
 */
export async function getUserOrganizations(userId?: string) {
  const supabase = await createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }
  
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      organization:organizations (
        id,
        name,
        slug,
        description,
        logo_url,
        created_at
      )
    `)
    .eq('user_id', userId);
  
  if (error) return [];
  return data.map(item => ({
    ...item.organization,
    userRole: item.role
  }));
}

/**
 * Check if user can manage an event (is organizer of the event's organization)
 */
export async function canManageEvent(eventId: string, userId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }
  
  // Get event's organization_id
  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .single();
  
  if (!event) return false;
  
  return isOrganizer(event.organization_id, userId);
}

/**
 * Check if user can update an organization
 */
export async function canUpdateOrganization(
  organizationId: string, 
  userId?: string
): Promise<boolean> {
  return isMember(organizationId, userId);
}

/**
 * Check if user can delete an organization (must be creator)
 */
export async function canDeleteOrganization(
  organizationId: string, 
  userId?: string
): Promise<boolean> {
  const supabase = await createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }
  
  const { data } = await supabase
    .from('organizations')
    .select('created_by')
    .eq('id', organizationId)
    .single();
  
  return data?.created_by === userId;
}

/**
 * Check if user can manage organization members (must be organizer)
 */
export async function canManageMembers(
  organizationId: string, 
  userId?: string
): Promise<boolean> {
  return isOrganizer(organizationId, userId);
}

/**
 * Get user's bookings for an event
 */
export async function getUserBookingsForEvent(eventId: string, userId?: string) {
  const supabase = await createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'confirmed');
  
  if (error) return [];
  return data;
}

/**
 * Check if user has already booked an event
 */
export async function hasBookedEvent(eventId: string, userId?: string): Promise<boolean> {
  const bookings = await getUserBookingsForEvent(eventId, userId);
  return bookings.length > 0;
}
