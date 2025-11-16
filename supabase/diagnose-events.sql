-- Quick Diagnostic Queries for Events Table

-- 1. Check total events count
SELECT COUNT(*) as total_events FROM events;

-- 2. Check events by status
SELECT status, COUNT(*) as count 
FROM events 
GROUP BY status;

-- 3. Check all events with their time classification
SELECT 
  id,
  title,
  status,
  start_date,
  end_date,
  CASE 
    WHEN start_date > NOW() THEN 'upcoming'
    WHEN start_date <= NOW() AND end_date > NOW() THEN 'ongoing'
    WHEN end_date <= NOW() THEN 'past'
  END as time_status,
  organization_id
FROM events
ORDER BY start_date DESC;

-- 4. Check specifically for upcoming published events
SELECT 
  id,
  title,
  status,
  start_date,
  end_date,
  (start_date > NOW()) as is_future_date
FROM events
WHERE status = 'published' 
  AND start_date > NOW()
ORDER BY start_date ASC;

-- 5. If no events exist, check organizations first
SELECT id, name, slug, status 
FROM organizations 
WHERE status = 'active'
LIMIT 5;

-- 6. Check available event status enum values
SELECT unnest(enum_range(NULL::event_status)) as available_statuses;
