-- Fix RLS Policies for organization_members table
-- This fixes the infinite recursion issue

-- First, drop all existing policies on organization_members
DROP POLICY IF EXISTS "Organization members can view members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can remove members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;

-- Now create corrected policies without recursion

-- 1. Users can view their own memberships (simple, no recursion)
CREATE POLICY "Users can view their own memberships"
  ON public.organization_members
  FOR SELECT
  USING (user_id = auth.uid());

-- 2. Anyone can view organization members (public info)
CREATE POLICY "Anyone can view organization members"
  ON public.organization_members
  FOR SELECT
  USING (true);

-- 3. Organizers can add members to their organizations
-- We check the organizations table directly, not organization_members (avoiding recursion)
CREATE POLICY "Organizers can add members"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
        AND (
          created_by = auth.uid()  -- Creator is always organizer
          OR EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id
              AND om.user_id = auth.uid()
              AND om.role = 'organizer'
          )
        )
    )
  );

-- 4. Organizers can update members
CREATE POLICY "Organizers can update members"
  ON public.organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id
              AND om.user_id = auth.uid()
              AND om.role = 'organizer'
          )
        )
    )
  );

-- 5. Organizers can remove members
CREATE POLICY "Organizers can remove members"
  ON public.organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id
              AND om.user_id = auth.uid()
              AND om.role = 'organizer'
          )
        )
    )
  );

-- Fix bookings policies if they have similar issues
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can cancel their own bookings" ON public.bookings;

-- Recreate bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.bookings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id
        AND status = 'published'
        AND available_capacity >= quantity
    )
  );

CREATE POLICY "Users can cancel their own bookings"
  ON public.bookings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organizers can view their event bookings"
  ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizations o ON e.organization_id = o.id
      WHERE e.id = event_id
        AND (
          o.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = o.id
              AND om.user_id = auth.uid()
              AND om.role = 'organizer'
          )
        )
    )
  );
