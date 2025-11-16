-- Sample Events Creation Script
-- Run this in Supabase SQL Editor to create test events

-- First, let's check if we have organizations
-- SELECT id, name, slug FROM organizations LIMIT 5;

-- Create sample upcoming events (replace organization_id and created_by with real UUIDs)
-- Get a valid organization_id: SELECT id FROM organizations LIMIT 1;
-- Get a valid user_id: SELECT id FROM profiles LIMIT 1;

-- Example: Create an upcoming event
-- Replace 'YOUR_ORG_ID' and 'YOUR_USER_ID' with actual UUIDs from your database

/*
INSERT INTO events (
  organization_id,
  title,
  slug,
  description,
  venue_name,
  location,
  start_date,
  end_date,
  ticket_price,
  is_free,
  total_capacity,
  available_capacity,
  status,
  created_by
) VALUES (
  'YOUR_ORG_ID'::uuid,
  'Summer Music Festival 2025',
  'summer-music-festival-2025',
  'Join us for the biggest music festival of the summer! Featuring top artists and amazing performances.',
  'Central Park Arena',
  'New York, USA',
  NOW() + INTERVAL '30 days',  -- 30 days from now
  NOW() + INTERVAL '32 days',  -- 32 days from now
  49.99,
  false,
  1000,
  1000,
  'published',
  'YOUR_USER_ID'::uuid
);

INSERT INTO events (
  organization_id,
  title,
  slug,
  description,
  venue_name,
  location,
  start_date,
  end_date,
  ticket_price,
  is_free,
  total_capacity,
  available_capacity,
  status,
  created_by
) VALUES (
  'YOUR_ORG_ID'::uuid,
  'Tech Conference 2025',
  'tech-conference-2025',
  'Annual technology conference showcasing the latest innovations in AI, Cloud, and Web3.',
  'Convention Center',
  'San Francisco, USA',
  NOW() + INTERVAL '45 days',
  NOW() + INTERVAL '47 days',
  0,
  true,
  500,
  500,
  'published',
  'YOUR_USER_ID'::uuid
);

INSERT INTO events (
  organization_id,
  title,
  slug,
  description,
  venue_name,
  location,
  start_date,
  end_date,
  ticket_price,
  is_free,
  total_capacity,
  available_capacity,
  status,
  created_by
) VALUES (
  'YOUR_ORG_ID'::uuid,
  'Art Exhibition Opening',
  'art-exhibition-opening',
  'Contemporary art exhibition featuring works from emerging artists.',
  'Modern Art Gallery',
  'London, UK',
  NOW() + INTERVAL '15 days',
  NOW() + INTERVAL '60 days',
  25.00,
  false,
  200,
  200,
  'published',
  'YOUR_USER_ID'::uuid
);
*/

-- Query to help you get the IDs you need:
SELECT 
  'Organization ID: ' || o.id || ', User ID: ' || p.id as ids,
  o.name as org_name,
  p.fullname as user_name
FROM organizations o
CROSS JOIN profiles p
LIMIT 1;

-- After creating events, verify they exist:
-- SELECT id, title, status, start_date, end_date, 
--        (start_date > NOW()) as is_upcoming,
--        (start_date <= NOW() AND end_date > NOW()) as is_ongoing,
--        (end_date <= NOW()) as is_past
-- FROM events
-- ORDER BY start_date DESC;
