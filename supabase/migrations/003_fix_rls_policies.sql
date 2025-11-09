-- Fix: organization_members SELECT policy
-- Remove the recursive policy completely and allow authenticated users to view
-- Access control will be handled at the application level

-- Drop all existing policies
DROP POLICY IF EXISTS "Organization members can view members" ON public.organization_members;

-- Simple policy: authenticated users can view all organization members
-- This removes the recursion issue
CREATE POLICY "Authenticated users can view organization members" 
  ON public.organization_members FOR SELECT 
  TO authenticated
  USING (true);
