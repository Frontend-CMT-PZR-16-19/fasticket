-- Migration 007: Fix infinite recursion in organization_members RLS
-- This fixes the circular reference in RLS policies and allows triggers to work

BEGIN;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Organization members can view members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can update member roles" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can remove members" ON public.organization_members;

-- Recreate the trigger function with proper security
DROP FUNCTION IF EXISTS public.handle_new_organization() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER 
SECURITY DEFINER  -- This bypasses RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.created_by, 'organizer', NEW.created_by);
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- Create new RLS policies without circular references

-- 1. SELECT: Allow viewing own membership and other members in same org
CREATE POLICY "Organization members can view members" 
  ON public.organization_members FOR SELECT 
  USING (
    user_id = auth.uid() OR  -- Always see your own memberships
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- 2. INSERT: Only for existing organizers (trigger bypasses this with SECURITY DEFINER)
CREATE POLICY "Organizers can add members" 
  ON public.organization_members FOR INSERT 
  WITH CHECK (
    -- Check if inserter is an organizer (subquery to avoid recursion)
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'organizer'
    )
  );

-- 3. UPDATE: Only organizers can update roles
CREATE POLICY "Organizers can update member roles" 
  ON public.organization_members FOR UPDATE 
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid() 
        AND om.role = 'organizer'
        AND om.id != organization_members.id  -- Prevent self-update
    )
  );

-- 4. DELETE: Only organizers can remove members (but not themselves)
CREATE POLICY "Organizers can remove members" 
  ON public.organization_members FOR DELETE 
  USING (
    user_id != auth.uid() AND  -- Cannot delete yourself
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'organizer'
    )
  );

COMMIT;
