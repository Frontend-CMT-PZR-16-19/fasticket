-- Migration 006: Create helpful database views
-- Author: Fasticket Team
-- Date: 2025-11-09

BEGIN;

-- View: Upcoming Events
CREATE OR REPLACE VIEW public.upcoming_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  o.logo_url as organization_logo,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.start_date > NOW();

-- View: Ongoing Events
CREATE OR REPLACE VIEW public.ongoing_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  o.logo_url as organization_logo,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.start_date <= NOW()
  AND e.end_date > NOW();

-- View: Past Events
CREATE OR REPLACE VIEW public.past_events AS
SELECT 
  e.*,
  o.name as organization_name,
  o.slug as organization_slug,
  o.logo_url as organization_logo,
  (SELECT COUNT(*) FROM public.bookings WHERE event_id = e.id AND status = 'confirmed') as total_bookings
FROM public.events e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.status = 'published' 
  AND e.end_date <= NOW();

COMMIT;
