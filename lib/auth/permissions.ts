// =====================================================
// Authentication & Permission Helpers
// RFC-002: Authentication & Authorization System
// =====================================================

import { createClient } from '@/lib/supabase/server';
import { createClient as createClientClient } from '@/lib/supabase/client';
import type { OrganizationRole, Organization, OrganizationMember } from '@/types/database';

// =====================================================
// SERVER-SIDE PERMISSIONS
// =====================================================

/**
 * Check if user is an organizer in a specific organization
 */
export async function isOrganizer(userId: string, organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('role', 'organizer')
    .single();

  return !error && data !== null;
}

/**
 * Check if user is a member (any role) in a specific organization
 */
export async function isOrganizationMember(userId: string, organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  return !error && data !== null;
}

/**
 * Check if user is an organizer in ANY organization
 */
export async function isOrganizerAnywhere(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'organizer')
    .limit(1);

  return !error && data !== null && data.length > 0;
}

/**
 * Get user's role in a specific organization
 */
export async function getUserRoleInOrganization(
  userId: string, 
  organizationId: string
): Promise<OrganizationRole | null> {
  const supabase = await createClient();
  
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
 * Get all organizations where user is an organizer
 */
export async function getUserOrganizerOrganizations(userId: string): Promise<Organization[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
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
    `)
    .eq('user_id', userId)
    .eq('role', 'organizer');

  if (error || !data) return [];
  return data.map((item: any) => item.organization).filter(Boolean);
}

/**
 * Get all organizations where user is a member (any role)
 */
export async function getUserOrganizations(userId: string): Promise<(Organization & { role: OrganizationRole })[]> {
  const supabase = await createClient();
  
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
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map((item: any) => ({
    ...item.organization,
    role: item.role
  })).filter((org: any) => org.id);
}

/**
 * Check if user can manage event (is organizer of event's organization)
 */
export async function canManageEvent(userId: string, eventId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Get event's organization
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) return false;

  // Check if user is organizer
  return isOrganizer(userId, event.organization_id);
}

/**
 * Check if user can view event bookings (is organizer of event's organization)
 */
export async function canViewEventBookings(userId: string, eventId: string): Promise<boolean> {
  return canManageEvent(userId, eventId);
}

// =====================================================
// CLIENT-SIDE PERMISSIONS
// =====================================================

/**
 * Client-side: Check if user is organizer in organization
 */
export async function isOrganizerClient(organizationId: string): Promise<boolean> {
  const supabase = createClientClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('role', 'organizer')
    .single();

  return !error && data !== null;
}

/**
 * Client-side: Get user's organizations
 */
export async function getUserOrganizationsClient(): Promise<(Organization & { role: OrganizationRole })[]> {
  const supabase = createClientClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id);

  if (error || !data) return [];
  return data.map((item: any) => ({
    ...item.organization,
    role: item.role
  })).filter((org: any) => org.id);
}

// =====================================================
// AUTHORIZATION GUARDS
// =====================================================

/**
 * Throw error if user is not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Throw error if user is not an organizer in the organization
 * Returns user and organization data
 */
export async function requireOrganizer(organizationSlug: string) {
  const user = await requireAuth();
  const organization = await getOrganizationBySlug(organizationSlug);
  
  if (!organization) {
    throw new Error('Organization not found');
  }
  
  const isOrg = await isOrganizer(user.id, organization.id);
  
  if (!isOrg) {
    throw new Error('Organizer access required');
  }
  
  return { user, organization };
}

/**
 * Throw error if user cannot manage the event
 */
export async function requireEventManager(eventId: string) {
  const user = await requireAuth();
  const canManage = await canManageEvent(user.id, eventId);
  
  if (!canManage) {
    throw new Error('Event management access required');
  }
  
  return user;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Generate URL-friendly slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/--+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '');  // Trim hyphens from start and end
}

/**
 * Check if slug is available for organization
 */
export async function isSlugAvailable(slug: string, excludeOrgId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  let query = supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug);

  if (excludeOrgId) {
    query = query.neq('id', excludeOrgId);
  }

  const { data, error } = await query.single();
  
  return error !== null || data === null;
}

/**
 * Format date for display
 */
export function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if event is upcoming
 */
export function isEventUpcoming(startDate: string): boolean {
  return new Date(startDate) > new Date();
}

/**
 * Check if event is ongoing
 */
export function isEventOngoing(startDate: string, endDate: string): boolean {
  const now = new Date();
  return new Date(startDate) <= now && now <= new Date(endDate);
}

/**
 * Check if event is past
 */
export function isEventPast(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

/**
 * Get event time status
 */
export function getEventTimeStatus(startDate: string, endDate: string): 'upcoming' | 'ongoing' | 'past' {
  if (isEventPast(endDate)) return 'past';
  if (isEventOngoing(startDate, endDate)) return 'ongoing';
  return 'upcoming';
}
