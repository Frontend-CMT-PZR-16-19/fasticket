-- Migration 004: Create events table
-- Author: Fasticket Team
-- Date: 2025-11-09

BEGIN;

-- Create event_status enum
DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create events table
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
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function: Generate unique slug for events
CREATE OR REPLACE FUNCTION public.generate_event_slug(event_title TEXT, org_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Generate base slug from title
  base_slug := lower(trim(regexp_replace(event_title, '[^a-zA-Z0-9]+', '-', 'g'), '-'));
  final_slug := base_slug;
  
  -- Check if slug exists and increment if needed
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.events 
      WHERE slug = final_slug 
        AND organization_id = org_id
    ) INTO slug_exists;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Add comment
COMMENT ON TABLE public.events IS 'Events hosted by organizations';

COMMIT;
