-- COMPLETE FIX: Organization Members RLS and Memberships
-- Run this ENTIRE script in Supabase SQL Editor

BEGIN;

-- =============================================================================
-- STEP 1: Temporarily disable RLS to fix the data
-- =============================================================================
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: Drop all existing problematic policies
-- =============================================================================
DROP POLICY IF EXISTS "Organization members can view members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Allow inserting organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can update member roles" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can remove members" ON public.organization_members;

-- =============================================================================
-- STEP 3: Recreate the trigger function with SECURITY DEFINER
-- =============================================================================
DROP FUNCTION IF EXISTS public.handle_new_organization() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER 
SECURITY DEFINER  -- Bypasses RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert creator as organizer
  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.created_by, 'organizer', NEW.created_by)
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- =============================================================================
-- STEP 4: Insert missing memberships for existing organizations
-- =============================================================================
INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
SELECT 
  o.id,
  o.created_by,
  'organizer'::public.organization_role,
  o.created_by
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.organization_members om 
  WHERE om.organization_id = o.id 
    AND om.user_id = o.created_by
)
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- =============================================================================
-- STEP 5: Create NEW RLS policies WITHOUT recursion
-- Use SIMPLE conditions - NO subqueries, NO function calls that query same table
-- =============================================================================

-- Drop the problematic policies first
DROP POLICY IF EXISTS "View organization memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;

-- Create a helper function to check organizer role (for non-SELECT operations only)
CREATE OR REPLACE FUNCTION public.user_is_organizer(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_org BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE organization_id = org_id 
      AND user_id = check_user_id
      AND role = 'organizer'
  ) INTO is_org;
  
  RETURN is_org;
END;
$$;

-- Policy 1: SELECT - SIMPLE RULE - Users can see their own memberships ONLY
CREATE POLICY "Users can view their own memberships"
  ON public.organization_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: INSERT - Add members (uses helper function - safe because not SELECT)
CREATE POLICY "Organizers can add members"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (
    -- Must be an organizer (uses SECURITY DEFINER function)
    public.user_is_organizer(organization_id, auth.uid())
  );

-- Policy 3: UPDATE - Change member roles (uses helper function)
CREATE POLICY "Organizers can update member roles"
  ON public.organization_members
  FOR UPDATE
  USING (
    -- Must be an organizer and not updating own role
    public.user_is_organizer(organization_id, auth.uid())
    AND user_id != auth.uid()
  );

-- Policy 4: DELETE - Remove members (uses helper function)
CREATE POLICY "Organizers can remove members"
  ON public.organization_members
  FOR DELETE
  USING (
    -- Must be an organizer and not removing yourself
    public.user_is_organizer(organization_id, auth.uid())
    AND user_id != auth.uid()
  );

-- =============================================================================
-- STEP 6: Re-enable RLS
-- =============================================================================
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

COMMIT;

-- =============================================================================
-- Verification query - Run separately to check results
-- =============================================================================
-- SELECT 
--   om.id,
--   o.name as organization_name,
--   o.slug,
--   om.role,
--   om.joined_at
-- FROM public.organization_members om
-- JOIN public.organizations o ON o.id = om.organization_id
-- ORDER BY om.joined_at DESC;
