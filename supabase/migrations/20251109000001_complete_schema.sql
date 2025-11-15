-- =====================================================
-- Fasticket Database Schema - Complete Migration
-- Created: 2025-11-09
-- RFC-001: Database Schema Design
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE OR UPDATE PROFILES TABLE
-- =====================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fullname TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table exists, add new columns (non-breaking)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing records to have timestamps
UPDATE public.profiles 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to handle new user signup (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, fullname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'fullname', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.profiles IS 'User profiles - all users start as regular attendees';

-- =====================================================
-- 2. CREATE ORGANIZATIONS TABLE
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Everyone can read organizations
CREATE POLICY "Organizations are viewable by everyone" 
  ON public.organizations FOR SELECT 
  USING (true);

-- Any authenticated user can create an organization
CREATE POLICY "Authenticated users can create organizations" 
  ON public.organizations FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

COMMENT ON TABLE public.organizations IS 'Organizations that host events';

-- =====================================================
-- 3. CREATE ORGANIZATION MEMBERS TABLE
-- =====================================================

-- Create enum for roles
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

-- Drop existing policies
DROP POLICY IF EXISTS "Organization members can view members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can update member roles" ON public.organization_members;
DROP POLICY IF EXISTS "Organizers can remove members" ON public.organization_members;

-- Members can view other members in their organization
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

-- Add UPDATE policy for organizations (now that organization_members exists)
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
-- 4. CREATE EVENTS TABLE
-- =====================================================

-- Create enum for event status
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

-- Drop existing policies
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update their events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete their events" ON public.events;

-- Everyone can view published events
CREATE POLICY "Published events are viewable by everyone" 
  ON public.events FOR SELECT 
  USING (status = 'published' OR created_by = auth.uid());

-- Organizers can create events for their organization
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
-- 5. CREATE BOOKINGS TABLE
-- =====================================================

-- Create enum for booking status
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
  IF TG_OP = 'INSERT' THEN
    -- Decrease capacity on new booking
    UPDATE public.events 
    SET available_capacity = available_capacity - NEW.quantity
    WHERE id = NEW.event_id AND available_capacity >= NEW.quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not enough capacity available';
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if booking was cancelled
    IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
      -- Increase capacity on cancellation
      UPDATE public.events 
      SET available_capacity = available_capacity + OLD.quantity
      WHERE id = OLD.event_id;
      
      -- Set cancelled_at timestamp
      NEW.cancelled_at = NOW();
    END IF;
    
    RETURN NEW;
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can cancel their own bookings" ON public.bookings;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings" 
  ON public.bookings FOR SELECT 
  USING (user_id = auth.uid());

-- Organizers can view bookings for their events
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
CREATE POLICY "Users can create bookings" 
  ON public.bookings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel their own bookings" 
  ON public.bookings FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.bookings IS 'Ticket bookings/purchases by users';

-- =====================================================
-- 6. CREATE HELPER VIEWS
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

COMMIT;

-- =====================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- =====================================================
