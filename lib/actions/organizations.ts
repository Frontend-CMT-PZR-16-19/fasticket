'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '@/types/database';

/**
 * Create a new organization
 * User will automatically be added as organizer via trigger
 */
export async function createOrganization(input: CreateOrganizationInput) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Generate slug from name if not provided
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: input.name,
      slug,
      description: input.description,
      logo_url: input.logo_url,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/organizations');
  return { data };
}

/**
 * Update an organization
 * Only members can update
 */
export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('organizations')
    .update(input)
    .eq('id', organizationId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/organizations');
  revalidatePath(`/organizations/${data.slug}`);
  return { data };
}

/**
 * Delete an organization
 * Only creator can delete
 */
export async function deleteOrganization(organizationId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId)
    .eq('created_by', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/organizations');
  return { success: true };
}

/**
 * Get all organizations for current user
 */
export async function getUserOrganizations() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
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
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const organizations = data.map((item: any) => ({
    ...item.organization,
    userRole: item.role,
  }));

  return { data: organizations };
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      created_by_profile:profiles!organizations_created_by_fkey (
        id,
        fullname,
        avatar_url
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      created_by_profile:profiles!organizations_created_by_fkey (
        id,
        fullname,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      joined_at,
      user_id,
      profiles!organization_members_user_id_fkey (
        id,
        fullname,
        avatar_url,
        bio
      )
    `)
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  // Transform the data to match expected structure
  const transformedData = data?.map((item: any) => ({
    id: item.id,
    role: item.role,
    joined_at: item.joined_at,
    profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
  })) || [];

  return { data: transformedData };
}

/**
 * Add member to organization
 * Only organizers can add members
 */
export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  role: 'organizer' | 'member' = 'member'
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations/${organizationId}`);
  return { data };
}

/**
 * Update member role
 * Only organizers can update roles
 */
export async function updateMemberRole(
  memberId: string,
  role: 'organizer' | 'member'
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations`);
  return { data };
}

/**
 * Remove member from organization
 * Only organizers can remove members
 */
export async function removeOrganizationMember(memberId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizations`);
  return { success: true };
}
