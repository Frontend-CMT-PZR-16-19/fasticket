-- First, check if you have an organization
SELECT id, name, slug, status, created_by 
FROM organizations 
WHERE created_by = '1132b0ca-1ad4-46c2-b238-2cecc90a5c30'
OR id IN (
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = '1132b0ca-1ad4-46c2-b238-2cecc90a5c30' 
  AND role = 'organizer'
);

-- If you don't have an organization, create one first:
INSERT INTO organizations (
  name,
  slug,
  description,
  status,
  created_by
) VALUES (
  'Test Organization',
  'test-org-' || floor(random() * 1000)::text,
  'This is a test organization',
  'active',
  '1132b0ca-1ad4-46c2-b238-2cecc90a5c30'
) RETURNING *;

-- Now create a published event (replace YOUR_ORG_ID with the organization id from above)
INSERT INTO events (
  organization_id,
  title,
  slug,
  description,
  start_date,
  end_date,
  location,
  venue_name,
  total_capacity,
  available_capacity,
  ticket_price,
  is_free,
  status,
  created_by
) VALUES (
  'YOUR_ORG_ID', -- Replace with your organization ID
  'Tech Conference 2025',
  'tech-conference-2025',
  'An amazing tech conference with industry leaders',
  '2025-12-15 10:00:00+00',
  '2025-12-15 18:00:00+00',
  'Istanbul Convention Center',
  'ICC Hall A',
  500,
  500,
  0,
  true,
  'published',
  '1132b0ca-1ad4-46c2-b238-2cecc90a5c30'
) RETURNING *;

-- Create another event for testing filters
INSERT INTO events (
  organization_id,
  title,
  slug,
  description,
  start_date,
  end_date,
  location,
  venue_name,
  total_capacity,
  available_capacity,
  ticket_price,
  is_free,
  status,
  created_by
) VALUES (
  'YOUR_ORG_ID', -- Replace with your organization ID
  'Startup Meetup',
  'startup-meetup-2025',
  'Monthly startup networking event',
  '2025-11-25 19:00:00+00',
  '2025-11-25 22:00:00+00',
  'Tech Hub Ankara',
  'Main Hall',
  100,
  100,
  25.00,
  false,
  'published',
  '1132b0ca-1ad4-46c2-b238-2cecc90a5c30'
) RETURNING *;

-- Verify events were created
SELECT id, title, slug, status, start_date, end_date
FROM events
WHERE created_by = '1132b0ca-1ad4-46c2-b238-2cecc90a5c30'
ORDER BY created_at DESC;
