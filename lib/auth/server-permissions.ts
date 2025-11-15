// Server-side authentication and authorization helpers
// Use these in Server Components and Server Actions

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Require authentication - throws error if not authenticated
 * Use in Server Components and Server Actions
 * @returns The authenticated user
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return user;
}

/**
 * Get current user or null (doesn't throw)
 * @returns The user or null
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Require organizer role for a specific organization
 * Throws error if not authorized
 * @param organizationId - The organization ID
 * @returns The authenticated user
 */
export async function requireOrganizer(organizationId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Direct query - RLS allows seeing own membership
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('role', 'organizer')
    .single();

  if (error || !data) {
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Check if user is organizer (doesn't throw)
 * @param organizationId - The organization ID
 * @returns Boolean indicating if user is organizer
 */
export async function isOrganizer(organizationId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();

  // Direct query - RLS allows seeing own membership
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('role', 'organizer')
    .single();

  return !error && !!data;
}

/**
 * Check if user is member of organization (doesn't throw)
 * @param organizationId - The organization ID
 * @returns Boolean indicating if user is a member
 */
export async function isMember(organizationId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Require organizer for event's organization
 * @param eventId - The event ID
 * @returns The authenticated user
 */
export async function requireEventOrganizer(eventId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get event's organization
  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) {
    redirect('/404');
  }

  // Check if user is organizer
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', event.organization_id)
    .eq('user_id', user.id)
    .eq('role', 'organizer')
    .maybeSingle();

  if (!membership) {
    redirect('/unauthorized');
  }

  return user;
}
