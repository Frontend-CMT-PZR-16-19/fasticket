-- Check existing events and their dates
SELECT 
  id, 
  title, 
  start_date, 
  end_date,
  status,
  CASE 
    WHEN start_date > NOW() THEN 'upcoming'
    WHEN start_date <= NOW() AND end_date > NOW() THEN 'ongoing'
    WHEN end_date <= NOW() THEN 'past'
  END as event_status
FROM events
ORDER BY start_date DESC;

-- Create a past event for testing (if needed)
-- Uncomment and run if you need test data:

/*
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
)
SELECT 
  id as organization_id,
  'Past Conference 2024' as title,
  'past-conference-2024' as slug,
  'This was an amazing conference that happened last year' as description,
  '2024-10-15 10:00:00+00' as start_date,
  '2024-10-15 18:00:00+00' as end_date,
  'Convention Center, Istanbul' as location,
  'Istanbul Convention Center' as venue_name,
  200 as total_capacity,
  50 as available_capacity,
  99.99 as ticket_price,
  false as is_free,
  'published' as status,
  created_by
FROM organizations 
WHERE status = 'active'
LIMIT 1;
*/

-- Create an ongoing event for testing
/*
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
)
SELECT 
  id as organization_id,
  'Ongoing Workshop November' as title,
  'ongoing-workshop-nov-2025' as slug,
  'This workshop is happening right now!' as description,
  '2025-11-14 10:00:00+00' as start_date,
  '2025-11-16 18:00:00+00' as end_date,
  'Tech Hub, Ankara' as location,
  'Ankara Tech Hub' as venue_name,
  100 as total_capacity,
  75 as available_capacity,
  0 as ticket_price,
  true as is_free,
  'published' as status,
  created_by
FROM organizations 
WHERE status = 'active'
LIMIT 1;
*/
