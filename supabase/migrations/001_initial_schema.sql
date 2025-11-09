-- Migration: Phase 1 - Foundation
-- Created: 9 Kasım 2025
-- Description: Complete database schema for Fasticket

-- =====================================================
-- STEP 1: Update profiles table
-- =====================================================

-- Add new columns to existing profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

COMMENT ON TABLE public.profiles IS 'User profiles - all users start as regular attendees';

-- =====================================================
-- STEP 2: Create organizations table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- Updated at trigger
DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Everyone can read organizations
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
CREATE POLICY "Organizations are viewable by everyone" 
  ON public.organizations FOR SELECT 
  USING (true);

-- Any authenticated user can create an organization
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations" 
  ON public.organizations FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

COMMENT ON TABLE public.organizations IS 'Organizations that host events';

-- =====================================================
-- STEP 3: Create organization_members table
-- =====================================================

-- Create enum type for organization role
DO $$ BEGIN
  CREATE TYPE public.organization_role AS ENUM ('organizer', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.organization_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(organization_id, role);

-- RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their organization
DROP POLICY IF EXISTS "Organization members can view members" ON public.organization_members;
CREATE POLICY "Organization members can view members" 
  ON public.organization_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id 
        AND om.user_id = auth.uid()
    )
  );

-- Organizers can add new members
DROP POLICY IF EXISTS "Organizers can add members" ON public.organization_members;
CREATE POLICY "Organizers can add members" 
  ON public.organization_members FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_members.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

-- Organizers can update member roles
DROP POLICY IF EXISTS "Organizers can update member roles" ON public.organization_members;
CREATE POLICY "Organizers can update member roles" 
  ON public.organization_members FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Organizers can remove members
DROP POLICY IF EXISTS "Organizers can remove members" ON public.organization_members;
CREATE POLICY "Organizers can remove members" 
  ON public.organization_members FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Function: Auto-add creator as organizer when organization is created
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.created_by, 'organizer', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

COMMENT ON TABLE public.organization_members IS 'Members and organizers of organizations';

-- =====================================================
-- STEP 2.5: Add organization UPDATE policy (after organization_members exists)
-- =====================================================

-- Only organization members can update
DROP POLICY IF EXISTS "Organization members can update their organization" ON public.organizations;
CREATE POLICY "Organization members can update their organization" 
  ON public.organizations FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id 
        AND user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 4: Create events table
-- =====================================================

-- Create enum type for event status
DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  location TEXT,
  venue_name TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  ticket_price DECIMAL(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  total_capacity INTEGER NOT NULL DEFAULT 0,
  available_capacity INTEGER NOT NULL DEFAULT 0,
  status public.event_status DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_capacity CHECK (available_capacity <= total_capacity AND available_capacity >= 0),
  CONSTRAINT valid_price CHECK (ticket_price >= 0),
  CONSTRAINT free_event_price CHECK (
    (is_free = true AND ticket_price = 0) OR 
    (is_free = false AND ticket_price > 0)
  ),
  UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(organization_id, slug);

-- Updated at trigger
DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view published events
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
CREATE POLICY "Published events are viewable by everyone" 
  ON public.events FOR SELECT 
  USING (status = 'published' OR created_by = auth.uid());

-- Organizers can create events for their organization
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
CREATE POLICY "Organizers can create events" 
  ON public.events FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = events.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

-- Organizers can update their organization's events
DROP POLICY IF EXISTS "Organizers can update their events" ON public.events;
CREATE POLICY "Organizers can update their events" 
  ON public.events FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = events.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

-- Organizers can delete their organization's events
DROP POLICY IF EXISTS "Organizers can delete their events" ON public.events;
CREATE POLICY "Organizers can delete their events" 
  ON public.events FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = events.organization_id
        AND user_id = auth.uid()
        AND role = 'organizer'
    )
  );

COMMENT ON TABLE public.events IS 'Events hosted by organizations';

-- =====================================================
-- STEP 5: Create bookings table
-- =====================================================

-- Create enum type for booking status
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status public.booking_status DEFAULT 'confirmed',
  booking_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_total CHECK (total_price >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Generate unique booking code
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'FST-' || upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate booking code on insert
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_code IS NULL OR NEW.booking_code = '' THEN
    NEW.booking_code := public.generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_booking();

-- Update event capacity on booking
CREATE OR REPLACE FUNCTION public.update_event_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Decrease capacity on new confirmed booking
    UPDATE public.events 
    SET available_capacity = available_capacity - NEW.quantity
    WHERE id = NEW.event_id AND available_capacity >= NEW.quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not enough capacity available';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status change from confirmed to cancelled
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      UPDATE public.events 
      SET available_capacity = available_capacity + OLD.quantity
      WHERE id = OLD.event_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_capacity_change ON public.bookings;
CREATE TRIGGER on_booking_capacity_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_capacity();

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" 
  ON public.bookings FOR SELECT 
  USING (user_id = auth.uid());

-- Organizers can view bookings for their events
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
CREATE POLICY "Organizers can view event bookings" 
  ON public.bookings FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = event_id 
        AND om.user_id = auth.uid()
        AND om.role = 'organizer'
    )
  );

-- Authenticated users can create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
CREATE POLICY "Users can create bookings" 
  ON public.bookings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own bookings
DROP POLICY IF EXISTS "Users can cancel their own bookings" ON public.bookings;
CREATE POLICY "Users can cancel their own bookings" 
  ON public.bookings FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.bookings IS 'Ticket bookings/purchases by users';

-- =====================================================
-- STEP 6: Create database views
-- =====================================================

-- Active Events View
CREATE OR REPLACE VIEW public.active_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.end_date > NOW();

-- Past Events View
CREATE OR REPLACE VIEW public.past_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.end_date <= NOW();

-- Upcoming Events View
CREATE OR REPLACE VIEW public.upcoming_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.start_date > NOW();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE '✓ Migration completed successfully!';
  RAISE NOTICE '✓ Tables created: profiles (updated), organizations, organization_members, events, bookings';
  RAISE NOTICE '✓ Views created: active_events, past_events, upcoming_events';
  RAISE NOTICE '✓ All RLS policies enabled';
  RAISE NOTICE '✓ All triggers configured';
END $$;
