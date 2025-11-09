// Client-side permission checks and authorization helpers
// These are for UI/UX purposes only - RLS policies are the real security layer

import { createClient } from '@/lib/supabase/client';
import type { OrganizationMembershipInfo } from '@/types/database';

export type Permission =
  | 'create_organization'
  | 'manage_organization'
  | 'create_event'
  | 'manage_event'
  | 'view_bookings'
  | 'invite_members'
  | 'manage_members';

/**
 * Check if the current user has a specific permission
 * @param permission - The permission to check
 * @param resourceId - The organization or event ID (context-dependent)
 * @returns Boolean indicating if user has permission
 */
export async function checkPermission(
  permission: Permission,
  resourceId?: string
): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  switch (permission) {
    case 'create_organization':
      // Any authenticated user can create an organization
      return true;

    case 'manage_organization':
    case 'create_event':
    case 'manage_event':
    case 'invite_members':
    case 'manage_members':
      // Must be an organizer of the specific organization
      if (!resourceId) return false;
      return await isOrganizer(user.id, resourceId);

    case 'view_bookings':
      // Must be an organizer of the organization that owns the event
      if (!resourceId) return false;
      return await canViewEventBookings(user.id, resourceId);

    default:
      return false;
  }
}

/**
 * Check if user is an organizer of a specific organization
 * @param userId - The user's ID
 * @param organizationId - The organization ID
 * @returns Boolean indicating if user is an organizer
 */
export async function isOrganizer(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('role', 'organizer')
    .maybeSingle();

  return !error && !!data;
}

/**
 * Check if user is a member of a specific organization (any role)
 * @param userId - The user's ID
 * @param organizationId - The organization ID
 * @returns Boolean indicating if user is a member
 */
export async function isMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Get all organizations where user is a member or organizer
 * @param userId - The user's ID
 * @returns Array of organization memberships with details
 */
export async function getUserOrganizations(
  userId: string
): Promise<OrganizationMembershipInfo[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      role,
      joined_at,
      organization:organizations (
        id,
        name,
        slug,
        description,
        logo_url,
        created_by,
        created_at,
        updated_at
      )
    `
    )
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error || !data) return [];

  return data.map((item: any) => ({
    role: item.role,
    joined_at: item.joined_at,
    organization: item.organization,
  }));
}

/**
 * Get organizations where user is an organizer
 * @param userId - The user's ID
 * @returns Array of organizations
 */
export async function getOrganizerOrganizations(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      organization:organizations (
        id,
        name,
        slug,
        description,
        logo_url,
        created_by,
        created_at,
        updated_at
      )
    `
    )
    .eq('user_id', userId)
    .eq('role', 'organizer');

  if (error || !data) return [];
  return data.map((d: any) => d.organization).filter(Boolean);
}

/**
 * Check if user can view bookings for a specific event
 * @param userId - The user's ID
 * @param eventId - The event ID
 * @returns Boolean indicating if user can view bookings
 */
async function canViewEventBookings(
  userId: string,
  eventId: string
): Promise<boolean> {
  const supabase = createClient();

  // Get event's organization
  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) return false;

  // Check if user is organizer of that organization
  return await isOrganizer(userId, event.organization_id);
}

/**
 * Check if user is organizer of any organization
 * @param userId - The user's ID
 * @returns Boolean indicating if user has any organizer role
 */
export async function isOrganizerAnywhere(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'organizer')
    .limit(1)
    .maybeSingle();

  return !error && !!data;
}
